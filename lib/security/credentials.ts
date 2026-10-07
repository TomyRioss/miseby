import { createHash } from "node:crypto";

export function credentialVersion(passwordHash: string, email: string) {
  return createHash("sha256").update(`${passwordHash}\0${email}`).digest("hex");
}
