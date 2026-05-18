import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockBitacora,
  mockUsuariosNoAdmins,
  seedSession,
  MOCK_BITACORA_FILAS,
  MOCK_USUARIOS,
} from '../support/mocks';

/**
 * E2E — Bitácora global de atenciones (Slice 2.5, RF-20).
 *
 * Solo rol ADMINISTRADOR. Todos los casos usan mocks de red.
 */

const SCREENSHOTS_DIR = 'test-results/screenshots';

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'ADMINISTRADOR' });
  await seedSession(page, 'ADMINISTRADOR');
}

async function irABitacora(page: Page): Promise<void> {
  await page.goto('/admin/bitacora');
  // Esperar el encabezado y que deje de cargar
  await expect(page.locator('[data-testid="bitacora-heading"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[role="status"][aria-label="Cargando bitácora"]')).not.toBeVisible({ timeout: 10_000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Bitacora — Slice 2.5 (RF-20)', () => {

  // ── Caso 1: Carga inicial — encabezado + 3 filas ─────────────────────────

  test('carga la pantalla con heading "Bitacora" y muestra las 3 filas del mock', async ({ page }) => {
    await setup(page);
    await mockBitacora(page);
    await mockUsuariosNoAdmins(page);

    await irABitacora(page);

    // Heading visible
    await expect(page.locator('[data-testid="bitacora-heading"]')).toContainText('Bitácora');

    // Las 3 filas del mock deben estar presentes
    const colaboradores = page.locator('[data-testid="fila-colaborador"]');
    await expect(colaboradores).toHaveCount(3, { timeout: 8_000 });

    // Verificar texto esperado en las filas
    await expect(colaboradores.nth(0)).toContainText(MOCK_BITACORA_FILAS[0].colaborador);
    await expect(colaboradores.nth(1)).toContainText(MOCK_BITACORA_FILAS[1].colaborador);
    await expect(colaboradores.nth(2)).toContainText(MOCK_BITACORA_FILAS[2].colaborador);

    // Verificar nombres de prospectos
    const prospectos = page.locator('[data-testid="fila-prospecto"]');
    await expect(prospectos.nth(0)).toContainText(MOCK_BITACORA_FILAS[0].prospecto);
    await expect(prospectos.nth(1)).toContainText(MOCK_BITACORA_FILAS[1].prospecto);

    // Verificar resultados
    const resultados = page.locator('[data-testid="fila-resultado"]');
    await expect(resultados.nth(0)).toBeVisible();
  });

  // ── Caso 2: Filtro campaña → re-consulta con param en URL ────────────────

  test('aplicar filtro campania re-consulta con el parametro en la URL', async ({ page }) => {
    await setup(page);
    await mockBitacora(page);
    await mockUsuariosNoAdmins(page);

    await irABitacora(page);

    // Escribir en el campo campaña
    const inputCampania = page.locator('[data-testid="input-campania"]');
    await inputCampania.fill('Campaña A');

    // Capturar la siguiente request a bitacora
    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/reportes/bitacora') && !req.url().includes('exportar'),
    );

    // Clic en Buscar
    await page.locator('[data-testid="btn-buscar"]').click();

    const request = await requestPromise;
    const url = new URL(request.url());
    expect(url.searchParams.get('campania')).toBe('Campaña A');
  });

  // ── Caso 3: Estado vacío ──────────────────────────────────────────────────

  test('sin resultados muestra el estado vacio', async ({ page }) => {
    await setup(page);
    await mockBitacora(page, { empty: true });
    await mockUsuariosNoAdmins(page);

    await irABitacora(page);

    await expect(page.locator('[data-testid="bitacora-empty"]')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[data-testid="bitacora-empty"]')).toContainText('Sin resultados');
  });

  // ── Caso 4: Paginador visible ─────────────────────────────────────────────

  test('el paginador es visible cuando hay resultados', async ({ page }) => {
    await setup(page);
    await mockBitacora(page);
    await mockUsuariosNoAdmins(page);

    await irABitacora(page);

    await expect(page.locator('[data-testid="bitacora-paginator"]')).toBeVisible({ timeout: 8_000 });
  });

  // ── Caso 5: Limpiar filtros ──────────────────────────────────────────────

  test('limpiar filtros borra el campo campania y vuelve a buscar', async ({ page }) => {
    await setup(page);
    await mockBitacora(page);
    await mockUsuariosNoAdmins(page);

    await irABitacora(page);

    // Escribir en campaña
    await page.locator('[data-testid="input-campania"]').fill('AlgunaEmpresa');

    // Esperar next request al limpiar
    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/api/reportes/bitacora') && !req.url().includes('exportar'),
    );

    await page.locator('[data-testid="btn-limpiar"]').click();

    const request = await requestPromise;
    const url = new URL(request.url());
    // Tras limpiar, el param campania NO debe estar
    expect(url.searchParams.has('campania')).toBe(false);

    // El campo debe estar vacío
    await expect(page.locator('[data-testid="input-campania"]')).toHaveValue('');
  });

  // ── Caso 6: Backend 400 muestra snackbar con mensaje real ─────────────────

  test('error 400 del backend muestra snackbar con el mensaje real', async ({ page }) => {
    await setup(page);
    await mockBitacora(page, {
      fail: true,
      failMessage: 'La fecha "desde" es posterior a "hasta".',
    });
    await mockUsuariosNoAdmins(page);

    await page.goto('/admin/bitacora');
    // Esperar heading
    await expect(page.locator('[data-testid="bitacora-heading"]')).toBeVisible({ timeout: 10_000 });

    // Snackbar con el mensaje de error
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toBeVisible({ timeout: 8_000 });
    await expect(snack).toContainText('La fecha');
  });

  // ── Caso 7: Exportar Excel dispara descarga ───────────────────────────────

  test('boton Exportar Excel desencadena una descarga', async ({ page }) => {
    await setup(page);
    await mockBitacora(page);
    await mockUsuariosNoAdmins(page);

    await irABitacora(page);

    // Esperar evento download al hacer clic en Exportar
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="btn-exportar"]').click(),
    ]);

    expect(download.suggestedFilename()).toBe('bitacora.xlsx');
  });

  // ── Caso 8: Screenshot full-page ────────────────────────────────────────

  test('screenshot full-page de la bitacora con datos', async ({ page }) => {
    await setup(page);
    await mockBitacora(page);
    await mockUsuariosNoAdmins(page);

    await irABitacora(page);

    // Esperar que la tabla tenga filas
    await expect(page.locator('[data-testid="fila-colaborador"]').first()).toBeVisible({ timeout: 8_000 });

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/bitacora.png`,
      fullPage: true,
    });
  });

  // ── Caso 9: Dropdown colaborador con opciones del mock ────────────────────

  test('dropdown de colaborador contiene las opciones de MOCK_USUARIOS', async ({ page }) => {
    await setup(page);
    await mockBitacora(page);
    await mockUsuariosNoAdmins(page);

    await irABitacora(page);

    // Abrir el select de colaborador
    const selectColaborador = page.locator('[data-testid="select-colaborador"]');
    await selectColaborador.click({ force: true });

    const options = page.locator('mat-option');
    await expect(options.first()).toBeVisible({ timeout: 5_000 });

    // Verificar que aparezca al menos uno de los colaboradores del mock
    await expect(options.filter({ hasText: MOCK_USUARIOS[0].nombre })).toBeVisible();
  });

});
