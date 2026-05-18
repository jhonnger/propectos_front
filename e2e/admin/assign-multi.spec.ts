import { test, expect } from '@playwright/test';
import {
  mockBackend,
  mockAsignacionMulti,
  seedSession,
  MOCK_USUARIOS,
} from '../support/mocks';

/**
 * E2E — Asignación multi-colaborador (RF-19, slice 1.1).
 *
 * Todos los casos usan mocks de red.
 */
test.describe('Asignacion multi-colaborador', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page, { rol: 'ADMINISTRADOR' });
    await seedSession(page, 'ADMINISTRADOR');
  });

  test('repartir a 2 colaboradores: saldo baja y confirmar muestra el resumen', async ({
    page,
  }) => {
    await mockAsignacionMulti(
      page,
      { id: 1, prospectosSinAsignar: 4, cantidadProspectos: 10, nombrearchivo: 'test.xlsx' },
      {
        totalAsignados: 3,
        saldoSinAsignar: 1,
        detalle: [
          { usuarioId: 2, usuarioNombre: 'Cola Uno', asignados: 2 },
          { usuarioId: 3, usuarioNombre: 'Beta Dos', asignados: 1 },
        ],
      },
    );

    await page.goto('/admin/assign-prospects');

    // Esperar a que la tabla de cargas cargue (usar locator específico para evitar
    // strict-mode violation: el nombre aparece tanto en la tabla desktop como en la card mobile)
    await expect(page.locator('.load-filename').first()).toContainText('test.xlsx', { timeout: 8000 });

    // Abrir el panel multi
    const btnRepartir = page.locator('[data-testid="btn-repartir"]').first();
    await expect(btnRepartir).toBeVisible();
    await btnRepartir.click();

    const multiPanel = page.locator('[data-testid="multi-panel"]').first();
    await expect(multiPanel).toBeVisible();

    // Saldo inicial debe ser 4
    await expect(page.locator('[data-testid="saldo-disponible"]').first()).toContainText('4');

    // Fila 1: seleccionar "Cola Uno" con 2 prospectos
    const firstRow = page.locator('[data-testid="multi-row"]').first();
    await firstRow.locator('mat-select').click();
    await page.locator('mat-option').filter({ hasText: 'Cola Uno' }).click();
    await firstRow.locator('input[type="number"]').fill('2');

    // Agregar una segunda fila
    await page.locator('[data-testid="btn-agregar-fila"]').first().click();
    const rows = page.locator('[data-testid="multi-row"]');
    await expect(rows).toHaveCount(2);

    // Fila 2: seleccionar "Beta Dos" con 1 prospecto
    const secondRow = rows.nth(1);
    await secondRow.locator('mat-select').click();
    await page.locator('mat-option').filter({ hasText: 'Beta Dos' }).click();
    await secondRow.locator('input[type="number"]').fill('1');

    // Saldo debe mostrar 4 - 3 = 1
    await expect(page.locator('[data-testid="saldo-disponible"]').first()).toContainText('1');

    // El botón confirmar debe estar habilitado
    const btnConfirmar = page.locator('[data-testid="btn-confirmar-reparto"]').first();
    await expect(btnConfirmar).toBeEnabled();

    // Confirmar
    await btnConfirmar.click();

    // Resultado debe aparecer
    const resultPanel = page.locator('[data-testid="multi-result"]').first();
    await expect(resultPanel).toBeVisible({ timeout: 8000 });

    await expect(page.locator('[data-testid="stat-total-asignados"]').first()).toContainText('3');
    await expect(page.locator('[data-testid="stat-saldo-sin-asignar"]').first()).toContainText('1');

    // Detalle por colaborador
    const detalleRows = page.locator('[data-testid="result-detalle-row"]');
    await expect(detalleRows).toHaveCount(2);
    await expect(detalleRows.nth(0)).toContainText('Cola Uno');
    await expect(detalleRows.nth(1)).toContainText('Beta Dos');

    await page.screenshot({
      path: 'test-results/screenshots/assign-multi-ok.png',
      fullPage: true,
    });
  });

  test('suma > disponibles: boton confirmar deshabilitado y mensaje visible', async ({ page }) => {
    await mockAsignacionMulti(
      page,
      { id: 1, prospectosSinAsignar: 2, cantidadProspectos: 5, nombrearchivo: 'small.xlsx' },
      {},
    );

    await page.goto('/admin/assign-prospects');
    await expect(page.locator('.load-filename').first()).toContainText('small.xlsx', { timeout: 8000 });

    // Abrir panel multi
    await page.locator('[data-testid="btn-repartir"]').first().click();
    await expect(page.locator('[data-testid="multi-panel"]').first()).toBeVisible();

    // Fila 1: 3 prospectos (excede los 2 disponibles)
    const firstRow = page.locator('[data-testid="multi-row"]').first();
    await firstRow.locator('mat-select').click();
    await page.locator('mat-option').filter({ hasText: 'Cola Uno' }).click();
    await firstRow.locator('input[type="number"]').fill('3');

    // Saldo debe ser negativo → -1
    const saldoEl = page.locator('[data-testid="saldo-disponible"]').first();
    await expect(saldoEl).toContainText('-1');

    // Mensaje de overflow debe aparecer
    const overflowMsg = page.locator('[data-testid="saldo-overflow-msg"]').first();
    await expect(overflowMsg).toBeVisible();
    await expect(overflowMsg).toContainText('suma supera los disponibles');

    // El botón confirmar debe estar deshabilitado
    const btnConfirmar = page.locator('[data-testid="btn-confirmar-reparto"]').first();
    await expect(btnConfirmar).toBeDisabled();

    await page.screenshot({
      path: 'test-results/screenshots/assign-multi-invalid.png',
      fullPage: true,
    });
  });

  test('asignar-multi 400 backend: muestra el mensaje de error real', async ({ page }) => {
    await mockAsignacionMulti(
      page,
      { id: 1, prospectosSinAsignar: 4, cantidadProspectos: 4, nombrearchivo: 'err.xlsx' },
      {
        fail: true,
        failMessage: 'La suma solicitada (99) excede los prospectos disponibles (4).',
      },
    );

    await page.goto('/admin/assign-prospects');
    await expect(page.locator('.load-filename').first()).toContainText('err.xlsx', { timeout: 8000 });

    // Abrir panel y llenar una fila válida localmente
    await page.locator('[data-testid="btn-repartir"]').first().click();
    await expect(page.locator('[data-testid="multi-panel"]').first()).toBeVisible();

    const firstRow = page.locator('[data-testid="multi-row"]').first();
    await firstRow.locator('mat-select').click();
    await page.locator('mat-option').filter({ hasText: 'Cola Uno' }).click();
    await firstRow.locator('input[type="number"]').fill('4');

    await page.locator('[data-testid="btn-confirmar-reparto"]').first().click();

    // Panel de error debe mostrar el mensaje exacto del backend
    const errorPanel = page.locator('[data-testid="multi-error"]').first();
    await expect(errorPanel).toBeVisible({ timeout: 8000 });
    await expect(errorPanel).toContainText('La suma solicitada (99) excede los prospectos disponibles (4).');

    await page.screenshot({
      path: 'test-results/screenshots/assign-multi-error-400.png',
      fullPage: true,
    });
  });
});
