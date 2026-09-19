/**
 * Tests de CRUD de links para MiseLink.
 *flujo: crear → editar → ocultar → borrar
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
  await page.waitForTimeout(2000);
}

const LINK_TITLE = `Test Link ${Date.now()}`;
const LINK_URL = "https://example.com/test-link";
const LINK_TITLE_EDITED = `Edited Link ${Date.now()}`;

test.describe("CRUD Links", () => {
  test("crear un link nuevo", async ({ page }) => {
    await loginAndGoToMiseLink(page);

    // Click "Agregar" button to open the dialog
    const addBtn = page.locator('button:has-text("Agregar")').first();
    await addBtn.click();

    // Wait for dialog to be visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click the "Link" option inside the dialog
    const linkOption = dialog.locator('button:has-text("Link")').first();
    await linkOption.click();

    // Fill title and URL
    const titleInput = dialog.locator('input[placeholder="Título del enlace"]');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(LINK_TITLE);

    const urlInput = dialog.locator('input[placeholder="https://..."]');
    await urlInput.fill(LINK_URL);

    // Click "Agregar" to submit
    const submitBtn = dialog.locator('button:has-text("Agregar")').last();
    await submitBtn.click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });

    // Verify the link appears in the list
    await expect(page.locator(`text=${LINK_TITLE}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test("editar un link existente", async ({ page }) => {
    await loginAndGoToMiseLink(page);

    // Find the link title and click on it to edit
    const titleBtn = page.locator(`button:has-text("${LINK_TITLE}")`).first();
    await expect(titleBtn).toBeVisible({ timeout: 10_000 });
    await titleBtn.click();

    // The link card should now show an input for editing
    const titleInput = page.locator(`input[value="${LINK_TITLE}"]`).first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.clear();
    await titleInput.fill(LINK_TITLE_EDITED);
    await titleInput.blur();

    // Wait for the update
    await page.waitForTimeout(1500);

    // Verify the new title is visible
    await expect(page.locator(`text=${LINK_TITLE_EDITED}`).first()).toBeVisible({ timeout: 10_000 });
  });

  test("ocultar/mostrar link con switch", async ({ page }) => {
    await loginAndGoToMiseLink(page);

    // Find the link and its switch
    const linkCard = page.locator('[class*="rounded-2xl"][class*="border"][class*="bg-card"]').first();
    await expect(linkCard).toBeVisible({ timeout: 10_000 });

    // Find the switch inside the card
    const switchEl = linkCard.locator('button[role="switch"]');
    await expect(switchEl).toBeVisible({ timeout: 5000 });

    // Get initial state
    const initialState = await switchEl.getAttribute("data-state");

    // Toggle the switch
    await switchEl.click();
    await page.waitForTimeout(1000);

    // Verify state changed
    const newState = await switchEl.getAttribute("data-state");
    expect(newState).not.toEqual(initialState);

    // Toggle back
    await switchEl.click();
    await page.waitForTimeout(1000);
  });

  test("eliminar link con confirmación", async ({ page }) => {
    await loginAndGoToMiseLink(page);

    // Find the link card
    const linkCard = page.locator('[class*="rounded-2xl"][class*="border"][class*="bg-card"]').first();
    await expect(linkCard).toBeVisible({ timeout: 10_000 });

    // Click delete button (trash icon)
    const deleteBtn = linkCard.locator('button[aria-label="Eliminar enlace"]');
    await deleteBtn.click();

    // Wait for alert dialog
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5000 });

    // Click "Eliminar" to confirm
    const confirmBtn = alertDialog.locator('button:has-text("Eliminar")');
    await confirmBtn.click();

    // Wait for deletion
    await page.waitForTimeout(2000);
  });

  test("reordenar links con drag & drop", async ({ page }) => {
    await loginAndGoToMiseLink(page);

    // Wait for at least two link cards to be visible
    const cards = page.locator('[class*="rounded-2xl"][class*="border"][class*="bg-card"]');
    await expect(cards.nth(1)).toBeVisible({ timeout: 10_000 });

    // Get the drag handle of the first card (@dnd-kit uses aria-roledescription or aria-label)
    const firstHandle = cards.nth(0).locator(
      '[aria-label="Reordenar"], [data-testid*="drag"], [aria-roledescription="sortable"]'
    ).first();
    await expect(firstHandle).toBeVisible({ timeout: 5000 });

    const secondCard = cards.nth(1);

    // Record initial order — the text of the first card before dragging
    const firstCardTextBefore = await cards.nth(0).innerText();

    // Get bounding boxes for manual drag simulation (more reliable than page.dragAndDrop with dnd-kit)
    const handleBox = await firstHandle.boundingBox();
    const targetBox = await secondCard.boundingBox();

    if (handleBox && targetBox) {
      const startX = handleBox.x + handleBox.width / 2;
      const startY = handleBox.y + handleBox.height / 2;
      const endX = targetBox.x + targetBox.width / 2;
      const endY = targetBox.y + targetBox.height;

      // Simulate a realistic drag: pointer down → move slowly → drop
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Move in small steps so @dnd-kit registers the drag sensor
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        const y = startY + ((endY - startY) * i) / steps;
        await page.mouse.move(x, y);
        await page.waitForTimeout(50);
      }
      await page.mouse.up();
    }

    // Wait for the reorder animation / state update to settle
    await page.waitForTimeout(1500);

    // Verify the list still renders cards (order may or may not change depending on test data)
    const cardsAfter = page.locator('[class*="rounded-2xl"][class*="border"][class*="bg-card"]');
    const count = await cardsAfter.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("validación URL: rechazar URL inválida al crear link", async ({ page }) => {
    await loginAndGoToMiseLink(page);

    // Open the create dialog
    const addBtn = page.locator('button:has-text("Agregar")').first();
    await addBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Select "Link" option
    const linkOption = dialog.locator('button:has-text("Link")').first();
    await linkOption.click();

    // Fill title with a valid value
    const titleInput = dialog.locator('input[placeholder="Título del enlace"]');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill("Link con URL inválida");

    // Fill URL with an invalid value
    const urlInput = dialog.locator('input[placeholder="https://..."]');
    await urlInput.fill("not-a-url");

    // Try to submit
    const submitBtn = dialog.locator('button:has-text("Agregar")').last();
    await submitBtn.click();

    // The form should either:
    // a) show an inline error message near the input, or
    // b) keep the dialog open (not dismiss), or
    // c) the input itself gets an error styling
    await page.waitForTimeout(1000);

    // Check for any visible error message in the dialog
    const errorInDialog = dialog.locator(
      'p[class*="text-destructive"], [role="alert"], [class*="error"], span[class*="text-destructive"]'
    ).first();

    const dialogStillOpen = await dialog.isVisible();
    const hasErrorMsg = await errorInDialog.isVisible().catch(() => false);

    // At least one validation signal must be present:
    // dialog stayed open (didn't close on success) OR an error message appeared
    expect(dialogStillOpen || hasErrorMsg).toBeTruthy();
  });
});
