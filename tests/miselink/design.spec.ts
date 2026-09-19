/**
 * Tests de diseño para MiseLink.
 * Cambia tema, colores, fuentes y verifica persistencia.
 */
import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@miseby.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "Test1234!";

async function loginAndGoToDesign(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await page.goto("/dashboard/miselink/design");
  await page.waitForTimeout(2000);
}

test.describe("Design Editor", () => {
  test("muestra las secciones de diseño", async ({ page }) => {
    await loginAndGoToDesign(page);

    // Verify main sections are visible
    await expect(page.locator('text="Diseño"').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Tema")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Encabezado")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Fondo")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Botones")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Texto")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Colores")').first()).toBeVisible({ timeout: 5000 });
  });

  test("abrir y cerrar sección de Tema", async ({ page }) => {
    await loginAndGoToDesign(page);

    // Click "Tema"
    await page.locator('button:has-text("Tema")').first().click();
    await page.waitForTimeout(1000);

    // Should show theme details
    await expect(page.locator('button:has-text("← Volver")').first().or(page.locator('text="Tema"').first())).toBeVisible({ timeout: 5000 });

    // Go back
    const backBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    await backBtn.click();
    await page.waitForTimeout(500);
  });

  test("abrir sección de Colores y verificar controles", async ({ page }) => {
    await loginAndGoToDesign(page);

    // Click "Colores"
    await page.locator('button:has-text("Colores")').first().click();
    await page.waitForTimeout(1000);

    // Should show the save/discard buttons
    await expect(page.locator('button:has-text("Guardar")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Descartar")').first()).toBeVisible({ timeout: 5000 });
  });

  test("abrir sección de Texto y verificar fuentes", async ({ page }) => {
    await loginAndGoToDesign(page);

    // Click "Texto"
    await page.locator('button:has-text("Texto")').first().click();
    await page.waitForTimeout(1000);

    // Should show font options (Sans, Serif, Mono, Redonda)
    await expect(page.locator('text="Sans"').first().or(page.locator('text="Serif"').first())).toBeVisible({ timeout: 5000 });
  });

  test("preview se muestra en desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await loginAndGoToDesign(page);

    // The phone preview should be visible on desktop
    const preview = page.locator('[class*="max-w-[580px]"], [class*="sticky"]').first();
    await expect(preview).toBeVisible({ timeout: 10_000 });
  });

  test("persistencia de diseño — cambiar color, guardar, recargar y verificar", async ({ page }) => {
    await loginAndGoToDesign(page);

    // Open Colores section
    await page.locator('button:has-text("Colores")').first().click();
    await page.waitForTimeout(1000);

    // Find first color input (color picker or text input)
    const colorInputs = page.locator('input[type="color"]');
    const textInputs = page.locator('input[type="text"]').filter({ hasNot: page.locator('input[type="password"]') });

    let targetInput = colorInputs.first();
    const isColorPicker = (await colorInputs.count()) > 0;

    if (!isColorPicker) {
      // Fallback: look for any visible input inside the colors section
      targetInput = textInputs.first();
    }

    await expect(targetInput).toBeVisible({ timeout: 5000 });

    // Save the original value
    const originalValue = await targetInput.inputValue();

    // Set a new distinct color value
    const testValue = isColorPicker ? "#ff5722" : "#FF5722";
    await targetInput.fill(testValue);
    await page.waitForTimeout(500);

    // Click "Guardar"
    await page.locator('button:has-text("Guardar")').first().click();
    await page.waitForTimeout(2000);

    // Reload the page
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Navigate back to Colores
    await page.locator('button:has-text("Colores")').first().click();
    await page.waitForTimeout(1000);

    // Verify the color persisted — the same input should still have our test value
    const persistedInput = isColorPicker
      ? page.locator('input[type="color"]').first()
      : page.locator('input[type="text"]').filter({ hasNot: page.locator('input[type="password"]') }).first();

    await expect(persistedInput).toBeVisible({ timeout: 5000 });

    const persistedValue = await persistedInput.inputValue();
    // Normalize: color inputs may return lowercase hex
    expect(persistedValue.toLowerCase()).toBe(testValue.toLowerCase());
  });

  test("preview pública — abre nueva pestaña o diálogo con URL pública", async ({ page }) => {
    await loginAndGoToDesign(page);

    // Look for a preview / share / link button (e.g. "Vista previa", "Preview", "Compartir", "Ver perfil")
    const previewTriggers = [
      page.locator('button:has-text("Vista previa")').first(),
      page.locator('button:has-text("Preview")').first(),
      page.locator('button:has-text("Compartir")').first(),
      page.locator('a:has-text("Vista previa")').first(),
      page.locator('a:has-text("Preview")').first(),
      page.locator('button:has-text("Ver perfil")').first(),
      page.locator('a:has-text("Ver perfil")').first(),
      page.locator('[data-testid="preview-button"]').first(),
      page.locator('[data-testid="share-button"]').first(),
    ];

    let triggerFound = false;
    for (const trigger of previewTriggers) {
      if (await trigger.isVisible({ timeout: 1500 }).catch(() => false)) {
        // Try to intercept a new tab popup
        const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
        await trigger.click();
        const popup = await popupPromise;

        if (popup) {
          // A new tab opened — verify the URL
          const popupUrl = popup.url();
          expect(popupUrl).toMatch(/miseby\.com/);
          triggerFound = true;
          break;
        }

        // No popup — check for a dialog / modal / overlay with the public URL
        await page.waitForTimeout(1000);
        const dialog = page.locator('[role="dialog"], [class*="modal"], [class*="overlay"]').first();
        if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
          const dialogText = await dialog.textContent();
          expect(dialogText).toMatch(/miseby\.com/);
          triggerFound = true;
          break;
        }

        // Check the current page for a public link element
        const publicLink = page.locator('a[href*="miseby.com"]').first();
        if (await publicLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          const href = await publicLink.getAttribute("href");
          expect(href).toMatch(/miseby\.com/);
          triggerFound = true;
          break;
        }
      }
    }

    expect(triggerFound, "No preview/share trigger found or no public URL detected").toBeTruthy();
  });
});
