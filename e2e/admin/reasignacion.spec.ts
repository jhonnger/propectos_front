import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockEnRiesgo,
  mockReasignar,
  mockReasignarTodoColaborador,
  mockUsuariosNoAdmins,
  seedSession,
  MOCK_EN_RIESGO_ITEMS,
  MOCK_USUARIOS,
} from '../support/mocks';

/**
 * E2E — Reasignacion + "En riesgo" (Slice 2.3, RF-23).
 *
 * Solo rol ADMINISTRADOR. Todos los casos usan mocks de red.
 */

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'ADMINISTRADOR' });
  await seedSession(page, 'ADMINISTRADOR');
}

async function irAReasignacion(page: Page): Promise<void> {
  await page.goto('/admin/reasignacion');
  // Esperar que el contenedor principal cargue (stat badge siempre presente)
  await expect(page.locator('[data-testid="total-en-riesgo"]')).toBeVisible({ timeout: 10_000 });
  // Esperar que loading desaparezca
  await expect(page.locator('[role="status"]')).not.toBeVisible({ timeout: 10_000 });
}

/** Abre un mat-select via click forzado, evitando que mat-label o mdc-notched-outline intercepte. */
async function clickMatSelect(page: Page, testId: string): Promise<void> {
  const select = page.locator(`[data-testid="${testId}"]`);
  await select.click({ force: true });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Reasignacion — Slice 2.3 (RF-23)', () => {

  // ── Caso 1: en-riesgo vacío → muestra nota/empty ──────────────────────────

  test('en-riesgo vacio muestra nota del backend o estado vacio', async ({ page }) => {
    await setup(page);
    await mockEnRiesgo(page, {
      resultados: [],
      total: 0,
      nota: 'No hay colaboradores ausentes hoy (o no es dia laborable).',
    });
    await mockUsuariosNoAdmins(page);

    await irAReasignacion(page);

    const emptyEl = page.locator('[data-testid="empty-en-riesgo"]');
    await expect(emptyEl).toBeVisible({ timeout: 8_000 });
    await expect(emptyEl).toContainText('No hay colaboradores ausentes hoy');

    await page.screenshot({
      path: 'test-results/screenshots/reasignacion.png',
      fullPage: true,
    });
  });

  // ── Caso 2: con items → tabla con filas; seleccionar 2 + destino + reasignar ──

  test('tabla muestra filas; seleccionar 2 + destino + motivo => POST correcto => snackbar exito => recarga', async ({
    page,
  }) => {
    const capturedBodies: Array<{
      asignacionIds?: number[];
      nuevoUsuarioId?: number;
      motivo?: string;
    }> = [];

    page.on('request', (req) => {
      if (
        new URL(req.url()).pathname.endsWith('/api/reasignacion') &&
        req.method() === 'POST'
      ) {
        try {
          capturedBodies.push(JSON.parse(req.postData() ?? '{}'));
        } catch { /* */ }
      }
    });

    await setup(page);
    await mockEnRiesgo(page, { resultados: MOCK_EN_RIESGO_ITEMS, total: 2 });
    await mockUsuariosNoAdmins(page);
    await mockReasignar(page, { reasignados: 2, destinoNombre: 'Beta Dos', destinoId: 3 });

    await irAReasignacion(page);

    // Verificar que hay filas en la tabla
    const checkboxes = page.locator('[data-testid^="chk-"]');
    await expect(checkboxes).toHaveCount(2, { timeout: 8_000 });

    // Seleccionar los 2 checkboxes
    await page.locator('[data-testid="chk-1"]').click();
    await page.locator('[data-testid="chk-2"]').click();

    // Elegir colaborador destino via trigger del mat-select
    await clickMatSelect(page, 'select-destino');
    const options = page.locator('mat-option');
    await expect(options.first()).toBeVisible({ timeout: 5_000 });
    // Elegir Beta Dos (id=3)
    await options.filter({ hasText: MOCK_USUARIOS[1].nombre }).click();

    // Llenar motivo
    await page.locator('[data-testid="input-motivo"]').fill('Ausencia imprevista test');

    // El botón debe estar habilitado
    const btnReasignar = page.locator('[data-testid="btn-reasignar"]');
    await expect(btnReasignar).toBeEnabled({ timeout: 3_000 });

    // Clic en reasignar
    await btnReasignar.click();

    // Snackbar éxito
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('Beta Dos', { timeout: 8_000 });
    await expect(snack).toContainText('reasignado');

    // Verificar body enviado
    await page.waitForTimeout(300);
    expect(capturedBodies.length).toBeGreaterThan(0);
    expect(capturedBodies[0]['asignacionIds']).toEqual(expect.arrayContaining([1, 2]));
    expect(capturedBodies[0]['nuevoUsuarioId']).toBe(3);
    expect(capturedBodies[0]['motivo']).toBe('Ausencia imprevista test');
  });

  // ── Caso 3: backend 400 → muestra el message real, no cierra ─────────────

  test('backend 400 en reasignar muestra el message real y mantiene la seleccion', async ({
    page,
  }) => {
    await setup(page);
    await mockEnRiesgo(page, { resultados: MOCK_EN_RIESGO_ITEMS, total: 2 });
    await mockUsuariosNoAdmins(page);
    await mockReasignar(page, {
      fail: true,
      failMessage: 'El colaborador destino no esta activo.',
    });

    await irAReasignacion(page);

    // Seleccionar fila 1
    await page.locator('[data-testid="chk-1"]').click();

    // Elegir destino
    await clickMatSelect(page, 'select-destino');
    const options = page.locator('mat-option');
    await expect(options.first()).toBeVisible({ timeout: 5_000 });
    await options.first().click();

    // Reasignar
    await page.locator('[data-testid="btn-reasignar"]').click();

    // Error visible con el mensaje real
    const errorEl = page.locator('[data-testid="error-reasignacion"]');
    await expect(errorEl).toBeVisible({ timeout: 8_000 });
    await expect(errorEl).toContainText('El colaborador destino no esta activo.');

    // El checkbox sigue marcado (la selección no se pierde)
    const chk = page.locator('[data-testid="chk-1"] input[type="checkbox"]');
    await expect(chk).toBeChecked();
  });

  // ── Caso 4: "Reasignar TODO" de un colaborador ────────────────────────────

  test('reasignar TODO de un colaborador: POST a /colaborador/{id} exitoso muestra snackbar', async ({
    page,
  }) => {
    const capturedRequests: Array<{ url: string; body: Record<string, unknown> }> = [];

    page.on('request', (req) => {
      if (req.url().includes('/api/reasignacion/colaborador/') && req.method() === 'POST') {
        try {
          capturedRequests.push({
            url: req.url(),
            body: JSON.parse(req.postData() ?? '{}'),
          });
        } catch { /* */ }
      }
    });

    await setup(page);
    // En-riesgo vacío para ir directo al acordeón
    await mockEnRiesgo(page, {
      resultados: [],
      total: 0,
      nota: 'No hay colaboradores ausentes hoy.',
    });
    await mockUsuariosNoAdmins(page);
    await mockReasignarTodoColaborador(page, {
      reasignados: 5,
      destinoNombre: 'Beta Dos',
      destinoId: 3,
    });

    await irAReasignacion(page);

    // Expandir acordeón
    const accordionHeader = page.locator('mat-expansion-panel-header').first();
    await accordionHeader.click();
    // Esperar que el panel esté expandido
    await expect(page.locator('[data-testid="select-origen"]')).toBeVisible({ timeout: 5_000 });

    // El acordeón expone 2 mat-select: [0]=select-origen, [1]=select-destino-todo.
    // Usamos nth() dentro del panel para evitar colisiones con la accion-bar (fuera del DOM en este caso).
    const panelSelects = page.locator('mat-expansion-panel mat-select');

    // Select origen (índice 0)
    await panelSelects.nth(0).click({ force: true });
    const optionsOrigen = page.locator('mat-option');
    await expect(optionsOrigen.first()).toBeVisible({ timeout: 5_000 });
    // Seleccionar primer usuario como origen (id=2, Cola)
    await optionsOrigen.filter({ hasText: MOCK_USUARIOS[0].nombre }).first().click();
    // Esperar cierre del panel
    await expect(optionsOrigen.first()).not.toBeVisible({ timeout: 3_000 });

    // Select destino-todo (índice 1)
    await panelSelects.nth(1).click({ force: true });
    const optionsDestino = page.locator('mat-option');
    await expect(optionsDestino.first()).toBeVisible({ timeout: 5_000 });
    // Seleccionar segundo usuario como destino (id=3, Beta)
    await optionsDestino.filter({ hasText: MOCK_USUARIOS[1].nombre }).first().click();

    // Motivo
    await page.locator('[data-testid="input-motivo-todo"]').fill('Baja medica prolongada');

    // Botón habilitado
    const btnTodo = page.locator('[data-testid="btn-reasignar-todo"]');
    await expect(btnTodo).toBeEnabled({ timeout: 3_000 });

    await btnTodo.click();

    // Snackbar éxito
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('Beta Dos', { timeout: 8_000 });
    await expect(snack).toContainText('reasignado');

    // Verificar URL y body
    await page.waitForTimeout(300);
    expect(capturedRequests.length).toBeGreaterThan(0);
    expect(capturedRequests[0].url).toContain('/api/reasignacion/colaborador/2');
    expect(capturedRequests[0].body['nuevoUsuarioId']).toBe(3);
    expect(capturedRequests[0].body['motivo']).toBe('Baja medica prolongada');
  });

});
