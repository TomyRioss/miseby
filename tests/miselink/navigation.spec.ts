/**
 * Tests de autenticación y navegación básica para MiseLink.
 * Requiere un usuario de test en la DB (ver .env para credenciales).
 */
import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@miseby.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "Test1234!";

test.describe("Navegación MiseLink", () => {
  test("redirige a login si no hay sesión", async ({ page }) => {
    await page.goto("/dashboard/miselink");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login exitoso lleva al dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("navegar a /dashboard/miselink muestra el editor", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/dashboard/miselink");
    await expect(page.locator("text=MISE LINK").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navegar a /dashboard/miselink/design muestra el editor de diseño", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/dashboard/miselink/design");
    await expect(page.locator("text=Diseño").first()).toBeVisible({ timeout: 10_000 });
  });

  test("0 console errors en el editor", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/dashboard/miselink");
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(
      (e) => !e.includes("404") && !e.includes("favicon") && !e.includes("[miselink dashboard]"),
    );
    expect(criticalErrors).toEqual([]);
  });
});
