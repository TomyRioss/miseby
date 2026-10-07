import assert from "node:assert/strict";
import { test } from "node:test";
import { priceItems, orderTotal } from "../../lib/order-pricing";
import { isHttpUrl, safeHttpUrl } from "../../lib/safe-url";
import { publicRestaurantData } from "../../lib/public-restaurant-data";
import { passwordSchema, securityTokenSchema, resetPasswordSchema, loginSchema } from "../../lib/validations/auth";
import { credentialVersion } from "../../lib/security/credentials";
import { allowRequest, trustedClientIp } from "../../lib/security/rate-limit";
import { isSameOriginRequest, readJsonBody } from "../../lib/security/request-body";
import type { RestaurantProduct } from "../../lib/restaurant-theme";

const product: RestaurantProduct = {
  id: "p", categoryId: "c", name: "Meal", price: 0, available: true,
  variants: [{ id: "v", name: "Large", price: 100, isDefault: true }],
  modifierGroups: [{ id: "g", name: "Sauce", required: true, multiple: false,
    modifiers: [{ id: "a", name: "A", price: 5 }, { id: "b", name: "B", price: 7 }] }],
};

test("orders reject bypassing variants, duplicate modifiers and invalid selections", () => {
  for (const id of ["p", "p|base|a", "p|v|a,a", "p|v|a,b", "p|v|", "p|v|bogus", "p|v|a|extra", "p|v|a,"]) {
    assert.throws(() => priceItems([product], [{ id, qty: 1 }]), id);
  }
  const ambiguous = { ...product, modifierGroups: [...product.modifierGroups!, { ...product.modifierGroups![0], id: "g2" }] };
  assert.throws(() => priceItems([ambiguous], [{ id: "p|v|a", qty: 1 }]));
});

test("orders use server prices and enforce quantity and total bounds", () => {
  const clientItem = { id: "p|v|a", qty: 2, price: 0, name: "Fake" };
  const priced = priceItems([product], [clientItem]);
  assert.equal(priced[0].price, 105);
  assert.equal(priced[0].name, "Meal (Large · A)");
  assert.equal(orderTotal(priced), 210);
  for (const qty of [0, -1, 1.5, 100, NaN]) assert.throws(() => priceItems([product], [{ id: clientItem.id, qty }]));
  assert.throws(() => priceItems([{ ...product, available: false }], [clientItem]));
  assert.throws(() => orderTotal([{ id: "p", name: "p", price: 2_147_483_647, qty: 2 }]));
  assert.throws(() => priceItems([{ ...product, variants: [{ ...product.variants![0], price: 1.5 }] }], [clientItem]));
  assert.throws(() => priceItems([{ ...product, modifierGroups: [{ ...product.modifierGroups![0], modifiers: [{ id: "a", name: "A", price: -100 }] }] }], [clientItem]));
  const multiple = { ...product, modifierGroups: [{ ...product.modifierGroups![0], multiple: true }] };
  assert.equal(priceItems([multiple], [{ id: "p|v|a,b", qty: 1 }])[0].price, 112);
  assert.equal(priceItems([{ ...product, variants: [], modifierGroups: [], price: 10 }], [{ id: "p", qty: 1 }])[0].price, 10);
});

test("public links reject executable and malformed URL schemes", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,test", "vbscript:test", "file:///secret", "//example.com", "broken", null, 12]) {
    assert.equal(isHttpUrl(url), false);
    assert.equal(safeHttpUrl(url), null);
  }
  for (const url of ["https://example.com/menu", "http://example.com"]) assert.equal(safeHttpUrl(url), url);
});

test("public restaurant data excludes inventory metadata without mutating source", () => {
  const source = { products: [{ ...product, variants: [{ ...product.variants![0], costPrice: 40, packagingPrice: 3, sku: "internal" }] }] };
  const result = publicRestaurantData(source);
  assert.deepEqual(result.products![0].variants![0], { id: "v", name: "Large", price: 100, isDefault: true });
  for (const key of ["costPrice", "packagingPrice", "sku"]) assert.equal(key in result.products![0].variants![0], false);
  assert.equal(source.products[0].variants[0].costPrice, 40);
});

test("password byte limit prevents bcrypt truncation and tokens require full entropy", () => {
  assert.equal(passwordSchema.safeParse("Password123").success, true);
  assert.equal(passwordSchema.safeParse("A1" + "é".repeat(35)).success, true);
  for (const password of ["short1", "abcdefgh", "12345678", "A1" + "x".repeat(71), "A1" + "é".repeat(36)]) {
    assert.equal(passwordSchema.safeParse(password).success, false);
  }
  assert.equal(loginSchema.safeParse({ email: "a@example.com", password: "A1" + "é".repeat(36) }).success, false);
  const token = "a".repeat(64);
  assert.equal(securityTokenSchema.safeParse(token).success, true);
  assert.equal(resetPasswordSchema.safeParse({ token, password: "Password123", confirmPassword: "Password123" }).success, true);
  for (const invalid of ["", "a".repeat(63), "a".repeat(65), "g".repeat(64), "A".repeat(64)]) assert.equal(securityTokenSchema.safeParse(invalid).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token, password: "Password123", confirmPassword: "Password124" }).success, false);
});

test("credential fingerprints invalidate on password or email change", () => {
  const fingerprint = credentialVersion("hash", "a@example.com");
  assert.match(fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(fingerprint, credentialVersion("hash", "a@example.com"));
  assert.notEqual(fingerprint, credentialVersion("newhash", "a@example.com"));
  assert.notEqual(fingerprint, credentialVersion("hash", "b@example.com"));
  assert.notEqual(credentialVersion("ab", "c"), credentialVersion("a", "bc"));
});

test("rate limits enforce quotas independently for keys and scopes", async () => {
  const scope = `regression-${crypto.randomUUID()}`;
  assert.equal(await allowRequest(scope, "client-a", 2, 60), true);
  assert.equal(await allowRequest(scope, "client-a", 2, 60), true);
  assert.equal(await allowRequest(scope, "client-a", 2, 60), false);
  assert.equal(await allowRequest(scope, "client-b", 2, 60), true);
  assert.equal(await allowRequest(`${scope}-other`, "client-a", 2, 60), true);
});

test("IP headers are ignored unless proxy trust is explicitly configured", () => {
  const previous = process.env.TRUSTED_CLIENT_IP_HEADER;
  try {
    delete process.env.TRUSTED_CLIENT_IP_HEADER;
    const headers = new Headers({ "x-forwarded-for": "spoofed", "x-trusted-ip": "192.0.2.1, 192.0.2.2" });
    assert.equal(trustedClientIp(headers), null);
    process.env.TRUSTED_CLIENT_IP_HEADER = "x-trusted-ip";
    assert.equal(trustedClientIp(headers), "192.0.2.1");
  } finally {
    if (previous === undefined) delete process.env.TRUSTED_CLIENT_IP_HEADER;
    else process.env.TRUSTED_CLIENT_IP_HEADER = previous;
  }
});

function streamedRequest(parts: string[], cancel?: () => void): Request {
  const encoder = new TextEncoder();
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < parts.length) controller.enqueue(encoder.encode(parts[index++]));
      else controller.close();
    },
    cancel,
  });
  return new Request("http://localhost/test", { method: "POST", body, duplex: "half" } as RequestInit);
}

test("JSON parser bounds streamed bytes without Content-Length and cancels overflow", async () => {
  const valid = streamedRequest(['{"n":', "1}"]);
  assert.equal(valid.headers.has("content-length"), false);
  assert.deepEqual(await readJsonBody(valid, 7), { n: 1 });
  let cancelled = false;
  const oversized = streamedRequest(['{"n":', "123", "45}"], () => { cancelled = true; });
  await assert.rejects(readJsonBody(oversized, 7), /demasiado grande/);
  assert.equal(cancelled, true);
  // UTF-8 limits count bytes, not JavaScript characters.
  await assert.rejects(readJsonBody(streamedRequest(['"é"']), 3), /demasiado grande/);
});

test("JSON parser rejects malformed or missing bodies", async () => {
  await assert.rejects(readJsonBody(streamedRequest(["{invalid}"])));
  await assert.rejects(readJsonBody(new Request("http://localhost/test", { method: "POST" })));
});

test("same-origin guard rejects hostile, opaque and malformed origins", () => {
  const request = (origin?: string) => new Request("https://app.example.com/action", {
    method: "POST", headers: origin === undefined ? undefined : { origin },
  });
  assert.equal(isSameOriginRequest(request("https://app.example.com")), true);
  assert.equal(isSameOriginRequest(request()), true);
  for (const origin of ["https://attacker.example.com", "https://app.example.com.attacker.com", "http://app.example.com", "https://app.example.com:8443", "null", "invalid"]) {
    assert.equal(isSameOriginRequest(request(origin)), false, origin);
  }
});
