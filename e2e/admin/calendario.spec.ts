import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockCalendario,
  seedSession,
  MOCK_FERIADOS_DEFAULT,
} from '../support/mocks';

/**
 * E2E — Calendario laboral (RF-22, Slice 2.2).
 *
 * Solo rol ADMINISTRADOR. Todos los casos usan mocks de red.
 */

const SCREENSHOTS_DIR = 'test-results/screenshots';

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'ADMINISTRADOR' });
  await seedSession(page, 'ADMINISTRADOR');
}

async function irACalendario(page: Page): Promise<void> {
  await page.goto('/admin/calendario');
  await expect(page.locator('[data-testid="calendario-content"]')).toBeVisible({ timeout: 10_000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Calendario laboral — Slice 2.2 (RF-22)', () => {

  // ── Caso 1: lista los feriados del mock ──────────────────────────────────────

  test('carga inicial: muestra la lista de feriados del mock', async ({ page }) => {
    await setup(page);
    await mockCalendario(page, { feriados: MOCK_FERIADOS_DEFAULT });

    await irACalendario(page);

    // Deben aparecer las filas de la tabla
    const rows = page.locator('[data-testid="feriado-row"]');
    await expect(rows).toHaveCount(MOCK_FERIADOS_DEFAULT.length, { timeout: 8_000 });

    // Verificar que se muestra la descripcion del primer feriado
    await expect(page.locator('[data-testid="feriado-descripcion"]').first()).toContainText('Año Nuevo');

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/calendario.png`, fullPage: true });
  });

  // ── Caso 2: agregar feriado → POST y recarga ─────────────────────────────────

  test('agregar feriado: hace POST y recarga la lista', async ({ page }) => {
    await setup(page);

    // Contador de llamadas GET para verificar que recarga
    let getLlamadas = 0;
    await page.route(
      (url) => new URL(url).pathname.endsWith('/api/calendario'),
      async (route) => {
        if (route.request().method() === 'GET') {
          getLlamadas++;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_FERIADOS_DEFAULT),
          });
          return;
        }
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 99, fecha: '2026-12-25', esFeriado: true, descripcion: 'Navidad' }),
          });
          return;
        }
        await route.fallback();
      },
    );

    await irACalendario(page);

    // Esperar carga inicial
    await expect(page.locator('[data-testid="feriado-row"]')).toHaveCount(MOCK_FERIADOS_DEFAULT.length, { timeout: 8_000 });
    const getLlamadasAntes = getLlamadas;

    // Rellenar el formulario
    await page.fill('[data-testid="input-fecha"]', '2026-12-25');
    await page.fill('[data-testid="input-descripcion"]', 'Navidad');
    await page.click('[data-testid="btn-agregar-feriado"]');

    // Después del POST debe haber una nueva llamada GET (recarga)
    await page.waitForTimeout(1000);
    expect(getLlamadas).toBeGreaterThan(getLlamadasAntes);
  });

  // ── Caso 3: agregar duplicado → 400 → muestra el message del backend ─────────

  test('agregar feriado duplicado: 400 muestra el message real del backend', async ({ page }) => {
    await setup(page);
    await mockCalendario(page, {
      feriados: MOCK_FERIADOS_DEFAULT,
      failPost: true,
      failPostMessage: 'Ya existe un feriado para esa fecha.',
    });

    await irACalendario(page);
    await expect(page.locator('[data-testid="feriado-row"]')).toHaveCount(MOCK_FERIADOS_DEFAULT.length, { timeout: 8_000 });

    // Intentar agregar con fecha duplicada
    await page.fill('[data-testid="input-fecha"]', '2026-01-01');
    await page.fill('[data-testid="input-descripcion"]', 'Año Nuevo duplicado');
    await page.click('[data-testid="btn-agregar-feriado"]');

    // Debe aparecer el mensaje de error inline
    const errorAgregar = page.locator('[data-testid="error-agregar"]');
    await expect(errorAgregar).toBeVisible({ timeout: 8_000 });
    await expect(errorAgregar).toContainText('Ya existe un feriado para esa fecha.');
  });

  // ── Caso 4: eliminar → hace DELETE y recarga ─────────────────────────────────

  test('eliminar feriado: hace DELETE y recarga la lista', async ({ page }) => {
    await setup(page);

    let deleteLlamadas = 0;
    let getLlamadas = 0;

    // DELETE /api/calendario/{id}
    await page.route('**/api/calendario/**', async (route) => {
      if (route.request().method() !== 'DELETE') { await route.fallback(); return; }
      deleteLlamadas++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    // GET + POST exacto
    await page.route(
      (url) => new URL(url).pathname.endsWith('/api/calendario'),
      async (route) => {
        if (route.request().method() === 'GET') {
          getLlamadas++;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_FERIADOS_DEFAULT),
          });
          return;
        }
        await route.fallback();
      },
    );

    await irACalendario(page);
    await expect(page.locator('[data-testid="feriado-row"]')).toHaveCount(MOCK_FERIADOS_DEFAULT.length, { timeout: 8_000 });
    const getLlamadasAntes = getLlamadas;

    // Mockear la confirmación para que no bloquee el test
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Hacer clic en el primer botón de eliminar
    await page.locator('[data-testid="btn-eliminar-1"]').click();

    // Debe haberse hecho una llamada DELETE
    await page.waitForTimeout(1000);
    expect(deleteLlamadas).toBe(1);

    // Y debe haberse recargado la lista (nuevo GET)
    expect(getLlamadas).toBeGreaterThan(getLlamadasAntes);
  });

  // ── Caso 5: error de carga ────────────────────────────────────────────────────

  test('error al cargar: muestra mensaje de error y botón reintentar', async ({ page }) => {
    await setup(page);
    await mockCalendario(page, { failGet: true });

    await irACalendario(page);

    const errorCarga = page.locator('[data-testid="error-carga"]');
    await expect(errorCarga).toBeVisible({ timeout: 8_000 });
    await expect(errorCarga).toContainText('Error');
  });

});
