/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { passwordSchema } from "../../lib/validations/auth";
import { credentialVersion } from "../../lib/security/credentials";
import { securityTokenSchema, forgotPasswordSchema } from "../../lib/validations/auth";
import { createHash } from "node:crypto";

const nativeRequire = createRequire(import.meta.url);

// Compile the real module with isolated imports; no database client is loaded.
function loadModule(path: string, mocks: Record<string, any>) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} as Record<string, any> };
  new Function("require", "module", "exports", js)((name: string) => {
    if (name in mocks) return mocks[name];
    if (name.startsWith("node:") || name === "crypto") return nativeRequire(name);
    throw new Error(`Unexpected real import: ${name}`);
  }, module, module.exports);
  return module.exports;
}

function invitationFixture(overrides: Record<string, any> = {}) {
  const invitation = { id: "invite", token: "a".repeat(64), email: "member@example.com", organizationId: "org", role: "business_member", status: "pending", expiresAt: new Date(Date.now() + 60_000), ...overrides };
  const user = { id: "member", email: invitation.email, passwordHash: "current-hash", status: "active" };
  let passwordWrites = 0;
  let membersCreated = 0;
  const tx = {
    invitation: {
      findUnique: async () => ({ ...invitation }),
      updateMany: async () => {
        if (invitation.status !== "pending" || invitation.expiresAt <= new Date()) return { count: 0 };
        invitation.status = "accepted";
        return { count: 1 };
      },
    },
    userProfile: {
      findUnique: async () => user,
      update: async () => { passwordWrites++; throw new Error("Existing password must never be updated"); },
    },
    organizationMember: {
      findUnique: async () => membersCreated ? { id: "member-record" } : null,
      create: async () => { membersCreated++; return { id: "member-record" }; },
    },
  };
  const service = loadModule("../../lib/services/invitations.ts", {
    "server-only": {},
    bcryptjs: { compare: async (password: string, hash: string) => password === "Existing123" && hash === "current-hash", hash: async () => { throw new Error("Existing password must never be hashed"); } },
    "@/lib/prisma": { prisma: { $transaction: async (callback: (tx: any) => Promise<any>) => callback(tx) } },
    "@/lib/mail": { sendMail: async () => {} },
    "@/lib/services/audit": { logAudit: async () => {} },
    "@/lib/validations/auth": { passwordSchema, securityTokenSchema, forgotPasswordSchema },
    "@/lib/security/rate-limit": { allowRequest: async () => true },
  });
  return { service, user, invitation, writes: () => passwordWrites, created: () => membersCreated };
}

test("invitation rejects incorrect current password without changing account", async () => {
  const f = invitationFixture();
  await assert.rejects(f.service.acceptInvitation(f.invitation.token, "Attacker123"), /contrase/);
  assert.equal(f.writes(), 0);
  assert.equal(f.created(), 0);
});

test("invitation accepts existing password without mutating passwordHash", async () => {
  const f = invitationFixture();
  const user = await f.service.acceptInvitation(f.invitation.token, "Existing123");
  assert.equal(user.id, "member");
  assert.equal(user.passwordHash, "current-hash");
  assert.equal(f.writes(), 0);
  assert.equal(f.created(), 1);
});

test("invitation rejects unrelated session; matching session can accept", async () => {
  const f = invitationFixture();
  await assert.rejects(f.service.acceptInvitation(f.invitation.token, undefined, undefined, "attacker"), /contrase/);
  await f.service.acceptInvitation(f.invitation.token, undefined, undefined, "member");
  assert.equal(f.writes(), 0);
});

test("invitation rejects suspended accounts even with password or matching session", async () => {
  const f = invitationFixture();
  f.user.status = "suspended";
  await assert.rejects(f.service.acceptInvitation(f.invitation.token, "Existing123", undefined, "member"), /cuenta/);
  assert.equal(f.created(), 0);
});

test("invitation rejects expired tokens and already consumed invitations", async () => {
  const expired = invitationFixture({ expiresAt: new Date(Date.now() - 1) });
  await assert.rejects(expired.service.acceptInvitation(expired.invitation.token, "Existing123"), /expirada/);
  assert.equal(expired.created(), 0);
  const f = invitationFixture();
  await f.service.acceptInvitation(f.invitation.token, "Existing123");
  await assert.rejects(f.service.acceptInvitation(f.invitation.token, "Existing123"), /disponible/);
  assert.equal(f.created(), 1);
});

function authFixture() {
  let configuration: any;
  const profile = { id: "local-account", email: "member@example.com", role: "business_owner", status: "active", passwordHash: "hash-one" };
  loadModule("../../auth.ts", {
    "next-auth": (config: any) => { configuration = config; return {}; },
    "next-auth/providers/credentials": (config: any) => config,
    "next-auth/providers/google": () => ({}),
    "next-auth/jwt": {},
    bcryptjs: {},
    "@/lib/prisma": { prisma: { userProfile: { findUnique: async () => profile } } },
    "@/lib/security/rate-limit": { allowRequest: async () => true, trustedClientIp: () => null },
    "@/lib/security/credentials": { credentialVersion },
  });
  return { callbacks: configuration.callbacks, profile };
}

test("Google sign-in requires verified email", async () => {
  const { callbacks } = authFixture();
  for (const profile of [{}, { email_verified: false }, { email_verified: "true" }]) {
    assert.equal(await callbacks.signIn({ account: { provider: "google" }, user: { email: "member@example.com" }, profile }), false);
  }
  assert.equal(await callbacks.signIn({ account: { provider: "google" }, user: { email: "member@example.com" }, profile: { email_verified: true } }), true);
});

test("OAuth JWT uses local account ID rather than external provider ID", async () => {
  const { callbacks } = authFixture();
  const token = await callbacks.jwt({ token: { sub: "google-id" }, user: { id: "google-id", email: "MEMBER@example.com" } });
  assert.equal(token.sub, "local-account");
  assert.equal(token.role, "business_owner");
});

test("password and email changes revoke existing JWTs", async () => {
  for (const field of ["passwordHash", "email"] as const) {
    const { callbacks, profile } = authFixture();
    const token = await callbacks.jwt({ token: {}, user: { email: profile.email } });
    assert.equal((await callbacks.jwt({ token })).sub, "local-account");
    profile[field] = field === "email" ? "changed@example.com" : "hash-two";
    assert.equal(await callbacks.jwt({ token }), null);
  }
});

test("suspended account and legacy JWT without fingerprint are rejected", async () => {
  const { callbacks, profile } = authFixture();
  assert.equal(await callbacks.jwt({ token: { sub: profile.id } }), null);
  profile.status = "suspended";
  assert.equal(await callbacks.jwt({ token: {}, user: { email: profile.email } }), null);
});

function tokenFixture(kind: "passwordResetToken" | "emailVerificationToken", options: { count?: number; missing?: boolean; expired?: boolean; used?: boolean } = {}) {
  const rawToken = "b".repeat(64);
  const digest = createHash("sha256").update(rawToken).digest("hex");
  const calls: Array<{ name: string; args: any }> = [];
  const record = { id: "token-record", userId: "member", token: digest, usedAt: options.used ? new Date() : null, expiresAt: new Date(Date.now() + (options.expired ? -60_000 : 60_000)) };
  let stored: any;
  let emailed = "";
  const tokenModel = {
    create: async (args: any) => { stored = args.data; },
    deleteMany: async () => {},
    findUnique: async (args: any) => {
      calls.push({ name: "lookup", args });
      assert.deepEqual(args.where, { token: digest });
      return options.missing ? null : record;
    },
    updateMany: async (args: any) => {
      calls.push({ name: "consume", args });
      return { count: options.count ?? 1 };
    },
  };
  const userModel = {
    findUnique: async () => ({ id: "member", email: "member@example.com" }),
    update: async (args: any) => { calls.push({ name: "password-update", args }); },
    updateMany: async (args: any) => { calls.push({ name: "status-update", args }); },
  };
  const tx = { [kind]: tokenModel, userProfile: userModel };
  const service = loadModule("../../lib/services/auth.ts", {
    "server-only": {},
    bcryptjs: { hash: async () => "replacement-hash" },
    "@/lib/prisma": { prisma: { ...tx, $transaction: async (callback: (value: any) => Promise<any>) => callback(tx) } },
    "@/lib/mail": { sendMail: async (_email: string, _subject: string, html: string) => { emailed = html; } },
    "@/lib/services/audit": { logAudit: async () => {} },
    "@/lib/services/organizations": { generateUniqueSlug: async () => "unused" },
    "@/lib/validations/auth": { passwordSchema, securityTokenSchema },
  });
  const confirm = () => kind === "passwordResetToken" ? service.confirmPasswordReset(rawToken, "Replacement123") : service.confirmEmailVerification(rawToken);
  return { service, calls, confirm, stored: () => stored, email: () => emailed };
}

test("password reset and email verification store token digests while emailing raw tokens", async () => {
  for (const kind of ["passwordResetToken", "emailVerificationToken"] as const) {
    const f = tokenFixture(kind);
    if (kind === "passwordResetToken") await f.service.requestPasswordReset("member@example.com");
    else await f.service.issueVerificationToken("member", "member@example.com");
    const raw = /token=([a-f0-9]{64})/.exec(f.email())?.[1];
    assert.ok(raw);
    assert.notEqual(f.stored().token, raw);
    assert.equal(f.stored().token, createHash("sha256").update(raw).digest("hex"));
  }
});

test("token confirmation atomically consumes unused unexpired token before changing account", async () => {
  for (const kind of ["passwordResetToken", "emailVerificationToken"] as const) {
    const f = tokenFixture(kind);
    await f.confirm();
    assert.equal(f.calls[0].name, "lookup");
    const consume = f.calls[1];
    assert.equal(consume.name, "consume");
    assert.equal(consume.args.where.id, "token-record");
    assert.equal(consume.args.where.usedAt, null);
    assert.ok(consume.args.where.expiresAt.gt instanceof Date);
    assert.ok(consume.args.data.usedAt instanceof Date);
    const update = f.calls[2];
    assert.equal(update.name, kind === "passwordResetToken" ? "password-update" : "status-update");
    if (kind === "passwordResetToken") assert.deepEqual(update.args.data, { passwordHash: "replacement-hash" });
    else assert.deepEqual(update.args.where, { id: "member", status: "pending" });
  }
});

test("lost token consumption race aborts before password or account status update", async () => {
  for (const kind of ["passwordResetToken", "emailVerificationToken"] as const) {
    const f = tokenFixture(kind, { count: 0 });
    await assert.rejects(f.confirm(), /Token/);
    assert.deepEqual(f.calls.map((call) => call.name), ["lookup", "consume"]);
  }
});

test("invalid, missing, expired and used tokens never change account", async () => {
  for (const kind of ["passwordResetToken", "emailVerificationToken"] as const) {
    for (const options of [{ missing: true }, { expired: true }, { used: true }]) {
      const f = tokenFixture(kind, options);
      await assert.rejects(f.confirm(), /Token/);
      assert.deepEqual(f.calls.map((call) => call.name), ["lookup"]);
    }
    const f = tokenFixture(kind);
    await assert.rejects(kind === "passwordResetToken" ? f.service.confirmPasswordReset("invalid", "Replacement123") : f.service.confirmEmailVerification("invalid"));
    assert.equal(f.calls.length, 0);
  }
});
