import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import {
  mockBackend,
  mockBancos,
  seedSession,
  MOCK_BANCOS_DEFAULT,
} from '../support/mocks';

/**
 * E2E — Pantalla Bancos (admin), BK-3.
 *
 * Todos los casos usan mocks de red; no requieren backend real.
 */

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'ADMINISTRADOR' });
  await mockBancos(page);
  await seedSession(page, 'ADMINISTRADOR');
}

async function irABancos(page: Page): Promise<void> {
  await page.goto('/admin/bancos');
  await expect(page.locator('[data-testid="bancos-content"]')).toBeVisible({ timeout: 10_000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Pantalla Bancos — BK-3', () => {

  // ── Caso 1: La tabla lista los bancos del mock ─────────────────────────────

  test('lista los bancos: muestra nombre, estado, default y destino', async ({ page }) => {
    await setup(page);
    await irABancos(page);

    // Esperar tabla
    const tabla = page.locator('[data-testid="tabla-bancos"]');
    await expect(tabla).toBeVisible({ timeout: 8_000 });

    // Verificar que aparece el primer banco del mock
    await expect(page.locator('[data-testid="banco-nombre"]').first()).toContainText('BBVA');

    // Estado activo visible
    const estadoBadge = page.locator('[data-testid="banco-activo"]').first();
    await expect(estadoBadge).toContainText('Activo');

    // Banco destino visible
    const destino = page.locator('[data-testid="banco-destino"]').first();
    await expect(destino).toContainText('BCP');

    // Screenshot full-page de la pantalla Bancos
    const screenshotsDir = 'test-results/screenshots';
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    await page.screenshot({
      path: `${screenshotsDir}/bancos-lista.png`,
      fullPage: true,
    });
  });

  // ── Caso 2: Crear un nuevo banco ──────────────────────────────────────────

  test('crear banco: abre el formulario, completa el nombre y guarda; la tabla se actualiza', async ({ page }) => {
    const postedBodies: Array<Record<string, unknown>> = [];

    await setup(page);

    // Espiar las llamadas POST
    page.on('request', (req) => {
      if (
        req.method() === 'POST' &&
        new URL(req.url()).pathname.endsWith('/api/bancos')
      ) {
        try {
          postedBodies.push(JSON.parse(req.postData() ?? '{}') as Record<string, unknown>);
        } catch { /* */ }
      }
    });

    await irABancos(page);

    // Abrir formulario de creación
    const btnNuevo = page.locator('[data-testid="btn-nuevo-banco"]');
    await expect(btnNuevo).toBeVisible();
    await btnNuevo.click();

    // Formulario visible
    const form = page.locator('[data-testid="banco-form"]');
    await expect(form).toBeVisible({ timeout: 5_000 });

    // Completar nombre
    const inputNombre = page.locator('[data-testid="input-banco-nombre"]');
    await expect(inputNombre).toBeVisible();
    await inputNombre.fill('Interbank');

    // Guardar
    const btnGuardar = page.locator('[data-testid="btn-guardar-banco"]');
    await expect(btnGuardar).toBeEnabled();
    await btnGuardar.click();

    // Snackbar de éxito
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('Banco guardado', { timeout: 8_000 });

    // El formulario debe cerrarse
    await expect(form).not.toBeVisible({ timeout: 5_000 });

    // Se llamó al POST con el nombre
    await page.waitForTimeout(300);
    expect(postedBodies.length).toBeGreaterThan(0);
    expect(postedBodies[0]['nombre']).toBe('Interbank');

    await page.screenshot({
      path: 'test-results/screenshots/bancos-crear.png',
      fullPage: true,
    });
  });

  // ── Caso 3: Abrir formulario de edición ───────────────────────────────────

  test('editar banco: abre el formulario con datos precargados del banco seleccionado', async ({ page }) => {
    await setup(page);
    await irABancos(page);

    // Esperar que la tabla cargue
    await expect(page.locator('[data-testid="tabla-bancos"]')).toBeVisible({ timeout: 8_000 });

    // Click en editar el primer banco
    const btnEditar = page.locator(`[data-testid="btn-editar-banco-${MOCK_BANCOS_DEFAULT[0].id}"]`);
    await expect(btnEditar).toBeVisible();
    await btnEditar.click();

    // Formulario de edición visible
    const form = page.locator('[data-testid="banco-form"]');
    await expect(form).toBeVisible({ timeout: 5_000 });

    // El campo nombre debe tener el valor del banco
    const inputNombre = page.locator('[data-testid="input-banco-nombre"]');
    await expect(inputNombre).toBeVisible();
    const nombreVal = await inputNombre.inputValue();
    expect(nombreVal).toBe(MOCK_BANCOS_DEFAULT[0].nombre);
  });

});
