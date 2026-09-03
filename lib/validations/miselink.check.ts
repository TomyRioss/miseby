import assert from "node:assert/strict";
import { usernameSchema, linkItemSchema } from "./miselink";

// válidos
for (const v of ["tomy", "mise-by", "abc123", "a-b-c", "x".repeat(30)]) {
  assert.equal(usernameSchema.safeParse(v).success, true, `debería aceptar: ${v}`);
}

// normaliza
assert.equal(usernameSchema.parse("  ToMy  "), "tomy", "trim + lowercase");

// inválidos
for (const v of ["ab", "x".repeat(31), "-tomy", "tomy-", "to my", "to_my", "tomy!", "dashboard", "api"]) {
  assert.equal(usernameSchema.safeParse(v).success, false, `debería rechazar: ${v}`);
}

// link item
assert.equal(linkItemSchema.safeParse({ title: "Sitio", url: "https://x.com" }).success, true);
assert.equal(linkItemSchema.safeParse({ title: "", url: "https://x.com" }).success, false);
assert.equal(linkItemSchema.safeParse({ title: "Sitio", url: "no-url" }).success, false);

console.log("miselink validations OK");
