import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockPorCerrar,
  mockRegistrarVenta,
  mockNoCerro,
  seedSession,
  MOCK_POR_CERRAR_NORMAL,
  MOCK_POR_CERRAR_RECURRENTE,
} from '../support/mocks';

/**
 * E2E — Por cerrar (Slice 1.4, RF D4 / 5c.bis).
 *
 * Solo rol ADMINISTRADOR. Todos los casos usan mocks de red.
 */

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'ADMINISTRADOR' });
  await seedSession(page, 'ADMINISTRADOR');
}

async function irAPorCerrar(page: Page): Promise<void> {
  await page.goto('/admin/por-cerrar');
  await expect(
    page.locator('[data-testid="btn-cerrar-caso"]').first(),
  ).toBeVisible({ timeout: 10_000 });
}

// ──────────────────────────────────────────────────────────────────────────────

test.describe('Por cerrar — Slice 1.4', () => {

  // ── Caso 1: La lista muestra los DERIVADO con colaborador y badge recurrente ──

  test('lista los casos con colaborador que derivo y badge recurrente', async ({ page }) => {
    await setup(page);
    await mockPorCerrar(page, {
      resultados: [MOCK_POR_CERRAR_NORMAL, MOCK_POR_CERRAR_RECURRENTE],
      total: 2,
    });

    await page.goto('/admin/por-cerrar');

    // Esperar que cargue la tabla (al menos un botón "Cerrar caso")
    await expect(page.locator('[data-testid="btn-cerrar-caso"]').first()).toBeVisible({
      timeout: 10_000,
    });

    // Contador total
    await expect(page.locator('[data-testid="total-casos"]')).toContainText('2');

    // Colaborador que derivó (primera fila)
    const filas = page.locator('[data-testid="derivado-por"]');
    await expect(filas.first()).toContainText('Col Uno');

    // Badge recurrente solo en la segunda fila (nroPrestamosConcretados=2)
    const badges = page.locator('[data-testid="badge-recurrente"]');
    await expect(badges).toHaveCount(1);
    await expect(badges.first()).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/por-cerrar-lista.png',
      fullPage: true,
    });
  });

  // ── Caso 2: Registrar venta — sin fecha, confirmar deshabilitado ──────────

  test('registrar venta: sin fecha el boton confirmar esta deshabilitado', async ({ page }) => {
    await setup(page);
    await mockPorCerrar(page);
    await mockRegistrarVenta(page);

    await irAPorCerrar(page);

    // Abrir diálogo del primer caso
    await page.locator('[data-testid="btn-cerrar-caso"]').first().click();
    await expect(page.locator('[data-testid="btn-confirmar-cierre"]')).toBeVisible({
      timeout: 5_000,
    });

    // Por defecto la accion "venta" ya está seleccionada; sin fecha → disabled
    await expect(page.locator('[data-testid="btn-confirmar-cierre"]')).toBeDisabled();
  });

  // ── Caso 3: Registrar venta — con fecha futura → POST venta, muestra GANADO ─

  test('registrar venta: con fecha futura POST exitoso muestra GANADO y refresca lista', async ({
    page,
  }) => {
    await setup(page);
    await mockPorCerrar(page);
    await mockRegistrarVenta(page, { estado: 'GANADO' });

    await irAPorCerrar(page);
    await page.locator('[data-testid="btn-cerrar-caso"]').first().click();

    // Accion venta ya activa; ingresar fecha futura
    const fechaInput = page.locator('[data-testid="input-fecha-elegibilidad"]');
    await expect(fechaInput).toBeVisible({ timeout: 5_000 });
    await fechaInput.fill('2026-12-01');

    // Confirmar habilitado
    const btnConfirmar = page.locator('[data-testid="btn-confirmar-cierre"]');
    await expect(btnConfirmar).toBeEnabled({ timeout: 3_000 });

    await btnConfirmar.click();

    // Snackbar muestra GANADO
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('GANADO', { timeout: 8_000 });

    await page.screenshot({
      path: 'test-results/screenshots/por-cerrar-venta.png',
      fullPage: true,
    });
  });

  // ── Caso 4: Backend 400 (ya GANADO / fecha pasada) muestra el message real ─

  test('backend 400 en registrar venta muestra el message real y mantiene el dialogo', async ({
    page,
  }) => {
    await setup(page);
    await mockPorCerrar(page);
    await mockRegistrarVenta(page, {
      fail: true,
      failMessage: 'El caso ya fue cerrado como GANADO y no puede modificarse.',
    });

    await irAPorCerrar(page);
    await page.locator('[data-testid="btn-cerrar-caso"]').first().click();

    // Fecha futura válida
    const fechaInput = page.locator('[data-testid="input-fecha-elegibilidad"]');
    await expect(fechaInput).toBeVisible({ timeout: 5_000 });
    await fechaInput.fill('2026-12-01');

    await page.locator('[data-testid="btn-confirmar-cierre"]').click();

    // El error real del backend aparece
    const errorBanner = page.locator('[data-testid="error-cierre"]');
    await expect(errorBanner).toBeVisible({ timeout: 8_000 });
    await expect(errorBanner).toContainText(
      'El caso ya fue cerrado como GANADO y no puede modificarse.',
    );

    // El diálogo sigue abierto
    await expect(page.locator('[data-testid="btn-confirmar-cierre"]')).toBeVisible();
  });

  // ── Caso 5: No cerró → reintentar — sin fecha no puede confirmar ──────────

  test('no cerro reintentar: sin fecha el boton confirmar esta deshabilitado', async ({ page }) => {
    await setup(page);
    await mockPorCerrar(page);
    await mockNoCerro(page, { estado: 'EN_SEGUIMIENTO' });

    await irAPorCerrar(page);
    await page.locator('[data-testid="btn-cerrar-caso"]').first().click();

    // Cambiar acción a reintentar
    await page.locator('[data-testid="btn-accion-reintentar"]').click();

    // Sin fecha → confirmar deshabilitado
    await expect(page.locator('[data-testid="btn-confirmar-cierre"]')).toBeDisabled({
      timeout: 3_000,
    });
  });

  // ── Caso 6: No cerró → reintentar — con fecha → POST no-cerro REINTENTAR ──

  test('no cerro reintentar: con fecha POST no-cerro REINTENTAR exitoso', async ({ page }) => {
    const capturedBodies: Array<Record<string, unknown>> = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/cierre/') && req.url().includes('/no-cerro') && req.method() === 'POST') {
        try { capturedBodies.push(JSON.parse(req.postData() ?? '{}')); } catch { /* */ }
      }
    });

    await setup(page);
    await mockPorCerrar(page);
    await mockNoCerro(page, { estado: 'EN_SEGUIMIENTO' });

    await irAPorCerrar(page);
    await page.locator('[data-testid="btn-cerrar-caso"]').first().click();

    // Cambiar a reintentar
    await page.locator('[data-testid="btn-accion-reintentar"]').click();

    // Ingresar fecha y hora
    const fechaInput = page.locator('[data-testid="input-fecha-reintentar"]');
    await expect(fechaInput).toBeVisible({ timeout: 5_000 });
    await fechaInput.fill('2026-06-15T09:30');

    // Confirmar habilitado
    const btnConfirmar = page.locator('[data-testid="btn-confirmar-cierre"]');
    await expect(btnConfirmar).toBeEnabled({ timeout: 3_000 });

    await btnConfirmar.click();

    // Snackbar con EN_SEGUIMIENTO
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('EN_SEGUIMIENTO', { timeout: 8_000 });

    // Verificar body enviado
    await page.waitForTimeout(300);
    expect(capturedBodies.length).toBeGreaterThan(0);
    expect(capturedBodies[0]['accion']).toBe('REINTENTAR');
    expect(typeof capturedBodies[0]['fecha']).toBe('string');
  });

  // ── Caso 7: No cerró → descartar → POST no-cerro DESCARTAR ───────────────

  test('no cerro descartar: POST no-cerro DESCARTAR con estado DESCARTADO en snackbar', async ({
    page,
  }) => {
    const capturedBodies: Array<Record<string, unknown>> = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/cierre/') && req.url().includes('/no-cerro') && req.method() === 'POST') {
        try { capturedBodies.push(JSON.parse(req.postData() ?? '{}')); } catch { /* */ }
      }
    });

    await setup(page);
    await mockPorCerrar(page);
    await mockNoCerro(page, { estado: 'DESCARTADO' });

    await irAPorCerrar(page);
    await page.locator('[data-testid="btn-cerrar-caso"]').first().click();

    // Cambiar a descartar
    await page.locator('[data-testid="btn-accion-descartar"]').click();

    // El formulario de descarte muestra la advertencia
    await expect(page.locator('[data-testid="form-descartar"]')).toBeVisible({ timeout: 5_000 });

    // Confirmar (siempre habilitado para descartar)
    await expect(page.locator('[data-testid="btn-confirmar-cierre"]')).toBeEnabled();
    await page.locator('[data-testid="btn-confirmar-cierre"]').click();

    // Snackbar con DESCARTADO
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('DESCARTADO', { timeout: 8_000 });

    // Verificar body
    await page.waitForTimeout(300);
    expect(capturedBodies.length).toBeGreaterThan(0);
    expect(capturedBodies[0]['accion']).toBe('DESCARTAR');
  });

});
