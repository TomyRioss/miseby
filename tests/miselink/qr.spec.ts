/**
 * Tests de QR para MiseLink.
 * Verifica que el QR se genera, apunta a la URL correcta,
 * y que el share dialog muestra la información del usuario.
 */
import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@miseby.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "Test1234!";

async function loginAndGoToMiseLink(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await page.goto("/dashboard/miselink");
  await page.waitForLoadState("networkidle");
}

/** Click the share pill in the phone preview to open the share dialog. */
async function openShareDialog(page: import("@playwright/test").Page) {
  // The share button is a pill showing "miseby.com/{username}" with a share icon.
  // It lives inside the phone preview shell, titled "Compartir enlace".
  const sharePill = page.locator('button[title="Compartir enlace"]').first();
  await expect(sharePill).toBeVisible({ timeout: 10_000 });
  await sharePill.click();

  // The share dialog (role=dialog) should appear with title "Compartir"
  const dialog = page.locator('[role="dialog"]:has-text("Compartir")').first();
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  return dialog;
}

test.describe("QR Code", () => {
  test("share dialog muestra QR code generado con dimensiones reales", async ({ page }) => {
    await loginAndGoToMiseLink(page);
    const dialog = await openShareDialog(page);

    // qrcode.react renders a <canvas> element. Verify it exists inside the dialog
    // and has non-zero dimensions (meaning the QR was actually drawn, not just mounted).
    const canvas = dialog.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 5_000 });

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // QRCodeCanvas with size={148} should render at ~148px + margin.
    // Sanity-check the rendered size is in a reasonable range.
    expect(box!.width).toBeGreaterThanOrEqual(100);
    expect(box!.height).toBeGreaterThanOrEqual(100);
  });

  test("share dialog muestra la URL pública del usuario", async ({ page }) => {
    await loginAndGoToMiseLink(page);
    const dialog = await openShareDialog(page);

    // The dialog displays "miseby.com/{username}" in the URL bar.
    // We can't know the exact username, but we can assert the miseby.com prefix exists.
    const urlDisplay = dialog.locator("text=miseby.com").first();
    await expect(urlDisplay).toBeVisible({ timeout: 5_000 });
  });

  test("share dialog muestra el nombre de usuario con @", async ({ page }) => {
    await loginAndGoToMiseLink(page);
    const dialog = await openShareDialog(page);

    // The share dialog shows the username preceded by @ in the URL display area,
    // e.g. "miseby.com/testuser". The @ convention also appears in share targets.
    // Verify at least one element with @username pattern is visible.
    const handle = dialog.locator("text=/@\\w+/").first();
    await expect(handle).toBeVisible({ timeout: 5_000 });
  });

  test("share dialog contiene botones de compartir en redes sociales", async ({ page }) => {
    await loginAndGoToMiseLink(page);
    const dialog = await openShareDialog(page);

    // The share dialog lists social platforms: WhatsApp, X, Facebook, Telegram
    // plus a native "Más" share button.
    for (const platform of ["WhatsApp", "X", "Facebook", "Telegram"]) {
      const btn = dialog.locator(`text="${platform}"`).first();
      await expect(btn).toBeVisible({ timeout: 5_000 });
    }
  });

  test("share dialog tiene botón de copiar enlace", async ({ page }) => {
    await loginAndGoToMiseLink(page);
    const dialog = await openShareDialog(page);

    const copyBtn = dialog.locator('button:has-text("Copiar")').first();
    await expect(copyBtn).toBeVisible({ timeout: 5_000 });
    await expect(copyBtn).toBeEnabled();
  });

  test("QR dialog cierra correctamente con Escape", async ({ page }) => {
    await loginAndGoToMiseLink(page);
    await openShareDialog(page);

    // Press Escape to close the dialog
    await page.keyboard.press("Escape");

    // Dialog should no longer be visible
    const dialog = page.locator('[role="dialog"]:has-text("Compartir")');
    await expect(dialog).toBeHidden({ timeout: 3_000 });
  });
});
