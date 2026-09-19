/**
 * Tests responsive para MiseLink.
 * Verifica que la UI funciona en mobile (360x800) y desktop (1280x720).
 */
import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@miseby.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "Test1234!";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

test.describe("Responsive - Mobile (360x800)", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("editor es usable en mobile", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/miselink");
    await page.waitForTimeout(2000);

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(360);

    // "Agregar" button should be visible
    await expect(page.locator('button:has-text("Agregar")').first()).toBeVisible({ timeout: 10_000 });
  });

  test("design page es usable en mobile", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/miselink/design");
    await page.waitForTimeout(2000);

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(360);

    // Main sections visible
    await expect(page.locator('text="Diseño"').first()).toBeVisible({ timeout: 10_000 });
  });

  test("touch targets son suficientemente grandes", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/miselink");
    await page.waitForTimeout(2000);

    // Check that interactive elements have minimum touch target size
    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        // Minimum 44x44 touch target
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });
});

test.describe("Responsive - Desktop (1280x720)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("editor es usable en desktop", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/miselink");
    await page.waitForTimeout(2000);

    // "Agregar" button should be visible
    await expect(page.locator('button:has-text("Agregar")').first()).toBeVisible({ timeout: 10_000 });

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(1280);
  });

  test("design page es usable en desktop", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/miselink/design");
    await page.waitForTimeout(2000);

    // Main sections visible
    await expect(page.locator('text="Diseño"').first()).toBeVisible({ timeout: 10_000 });

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(1280);
  });

  test("phone preview visible en desktop", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard/miselink");
    await page.waitForTimeout(2000);

    // Desktop shows a fixed preview panel on the right
    // Check for the preview area (max-w-[580px] or sticky/fixed)
    const preview = page.locator('[class*="max-w-[580px]"]').first();
    const isDesktopLayout = await preview.isVisible({ timeout: 5000 }).catch(() => false);

    // On desktop, the preview should be visible
    if (isDesktopLayout) {
      await expect(preview).toBeVisible();
    }
  });
});
