/**
 * Test end-to-end del flujo completo de MiseLink.
 * Login → crear link → editar → toggle visibilidad → reordenar →
 * diseño → compartir/QR → cerrar diálogo.
 */
import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@miseby.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "Test1234!";

const LINK_TITLE = `E2E Link ${Date.now()}`;
const LINK_URL = "https://example.com/e2e-flow";
const LINK_TITLE_EDITED = `E2E Edited ${Date.now()}`;

/* ─── helpers ─────────────────────────────────────────────── */

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

async function goToEditor(page: import("@playwright/test").Page) {
  await page.goto("/dashboard/miselink");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
}

async function goToDesign(page: import("@playwright/test").Page) {
  await page.goto("/dashboard/miselink/design");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
}

/* ─── suite ───────────────────────────────────────────────── */

test.describe("MiseLink — Flujo E2E completo", () => {
  test("flujo completo: login → crear → editar → toggle → reordenar → diseño → share → QR → cerrar", async ({
    page,
  }) => {
    // ── 1. Login ────────────────────────────────────────────
    await login(page);

    // ── 2. Navegar al editor de MiseLink ─────────────────────
    await goToEditor(page);
    await expect(page.locator("text=MISE LINK").first()).toBeVisible({
      timeout: 10_000,
    });

    // ── 3. Crear un nuevo link con título y URL ──────────────
    const addBtn = page.locator('button:has-text("Agregar")').first();
    await addBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Seleccionar tipo "Link"
    const linkOption = dialog.locator('button:has-text("Link")').first();
    await linkOption.click();

    // Rellenar título
    const titleInput = dialog.locator('input[placeholder="Título del enlace"]');
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await titleInput.fill(LINK_TITLE);

    // Rellenar URL
    const urlInput = dialog.locator('input[placeholder="https://..."]');
    await urlInput.fill(LINK_URL);

    // Enviar
    const submitBtn = dialog.locator('button:has-text("Agregar")').last();
    await submitBtn.click();

    // Esperar que el diálogo se cierre
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // ── 4. Verificar que el link aparece en la lista ─────────
    const linkInList = page.locator(`text=${LINK_TITLE}`).first();
    await expect(linkInList).toBeVisible({ timeout: 10_000 });

    // ── 5. Editar el título del link ─────────────────────────
    const titleBtn = page.locator(`button:has-text("${LINK_TITLE}")`).first();
    await expect(titleBtn).toBeVisible({ timeout: 5_000 });
    await titleBtn.click();

    const editInput = page.locator(`input[value="${LINK_TITLE}"]`).first();
    await expect(editInput).toBeVisible({ timeout: 5_000 });
    await editInput.clear();
    await editInput.fill(LINK_TITLE_EDITED);
    await editInput.blur();

    // Esperar actualización
    await page.waitForTimeout(1500);
    await expect(page.locator(`text=${LINK_TITLE_EDITED}`).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── 6. Toggle visibilidad (hide/show) ────────────────────
    const linkCard = page
      .locator(
        '[class*="rounded-2xl"][class*="border"][class*="bg-card"]'
      )
      .first();
    await expect(linkCard).toBeVisible({ timeout: 10_000 });

    const switchEl = linkCard.locator('button[role="switch"]');
    await expect(switchEl).toBeVisible({ timeout: 5_000 });

    const initialState = await switchEl.getAttribute("data-state");
    await switchEl.click();
    await page.waitForTimeout(1000);

    const newState = await switchEl.getAttribute("data-state");
    expect(newState).not.toEqual(initialState);

    // Restaurar estado original
    await switchEl.click();
    await page.waitForTimeout(1000);

    // ── 7. Reordenar links (si hay más de uno) ───────────────
    const cards = page.locator(
      '[class*="rounded-2xl"][class*="border"][class*="bg-card"]'
    );
    const cardCount = await cards.count();

    if (cardCount >= 2) {
      const firstCard = cards.nth(0);
      const secondCard = cards.nth(1);

      const handle = firstCard
        .locator(
          '[aria-label="Reordenar"], [data-testid*="drag"], [aria-roledescription="sortable"]'
        )
        .first();

      if (await handle.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const handleBox = await handle.boundingBox();
        const targetBox = await secondCard.boundingBox();

        if (handleBox && targetBox) {
          const startX = handleBox.x + handleBox.width / 2;
          const startY = handleBox.y + handleBox.height / 2;
          const endX = targetBox.x + targetBox.width / 2;
          const endY = targetBox.y + targetBox.height;

          await page.mouse.move(startX, startY);
          await page.mouse.down();
          const steps = 10;
          for (let i = 1; i <= steps; i++) {
            const x = startX + ((endX - startX) * i) / steps;
            const y = startY + ((endY - startY) * i) / steps;
            await page.mouse.move(x, y);
            await page.waitForTimeout(50);
          }
          await page.mouse.up();
          await page.waitForTimeout(1500);

          // La lista sigue renderizando las cards tras reordenar
          const cardsAfter = page.locator(
            '[class*="rounded-2xl"][class*="border"][class*="bg-card"]'
          );
          expect(await cardsAfter.count()).toBeGreaterThanOrEqual(2);
        }
      }
    }

    // ── 8. Navegar a la página de Diseño ─────────────────────
    await goToDesign(page);

    // ── 9. Cambiar una configuración de tema/color ───────────
    await page.locator('button:has-text("Colores")').first().click();
    await page.waitForTimeout(1000);

    // Buscar inputs de color
    const colorInputs = page.locator('input[type="color"]');
    const hasColorPicker = (await colorInputs.count()) > 0;
    const targetInput = hasColorPicker
      ? colorInputs.first()
      : page
          .locator('input[type="text"]')
          .filter({ hasNot: page.locator('input[type="password"]') })
          .first();

    await expect(targetInput).toBeVisible({ timeout: 5_000 });
    const testColor = hasColorPicker ? "#ff5722" : "#FF5722";
    await targetInput.fill(testColor);
    await page.waitForTimeout(500);

    // ── 10. Guardar el diseño ────────────────────────────────
    await page.locator('button:has-text("Guardar")').first().click();
    await page.waitForTimeout(2000);

    // ── 11. Volver al editor ─────────────────────────────────
    await goToEditor(page);
    await expect(page.locator("text=MISE LINK").first()).toBeVisible({
      timeout: 10_000,
    });

    // ── 12. Abrir diálogo de compartir/vista previa ──────────
    const sharePill = page
      .locator('button[title="Compartir enlace"]')
      .first();
    await expect(sharePill).toBeVisible({ timeout: 10_000 });
    await sharePill.click();

    const shareDialog = page
      .locator('[role="dialog"]:has-text("Compartir")')
      .first();
    await expect(shareDialog).toBeVisible({ timeout: 5_000 });

    // ── 13. Verificar que se muestra el QR code ──────────────
    const canvas = shareDialog.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 5_000 });

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(100);
    expect(box!.height).toBeGreaterThanOrEqual(100);

    // ── 14. Verificar URL pública visible en el diálogo ───────
    const urlDisplay = shareDialog.locator("text=miseby.com").first();
    await expect(urlDisplay).toBeVisible({ timeout: 5_000 });

    // ── 15. Cerrar el diálogo ────────────────────────────────
    await page.keyboard.press("Escape");
    await expect(
      page.locator('[role="dialog"]:has-text("Compartir")')
    ).toBeHidden({ timeout: 3_000 });
  });
});
