import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockDashboardAdmin,
  mockColaboradorDrilldown,
  mockExportarProspectos,
  seedSession,
  MOCK_DASHBOARD_DATA,
  MOCK_DRILLDOWN_RESULTADOS,
} from '../support/mocks';

/**
 * E2E — Dashboard del dueño MVP (Slice 1.5, RF-18, §5f).
 *
 * Solo rol ADMINISTRADOR. Todos los casos usan mocks de red.
 */

const SCREENSHOTS_DIR = 'test-results/screenshots';

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'ADMINISTRADOR' });
  await seedSession(page, 'ADMINISTRADOR');
}

async function irAlDashboard(page: Page): Promise<void> {
  await page.goto('/admin/dashboard');
  await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible({ timeout: 10_000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard del dueno — Slice 1.5', () => {

  // ── Caso 1: Carga correcta — tarjetas HOY, MES, embudo y tabla bases ────────

  test('carga el dashboard con tarjetas HOY y MES, embudo y tabla de bases', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page);
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await irAlDashboard(page);

    // Banda HOY existe
    await expect(page.locator('[data-testid="banda-hoy"]')).toBeVisible();

    // KPIs HOY
    await expect(page.locator('[data-testid="hoy-ventas"]')).toContainText(
      String(MOCK_DASHBOARD_DATA.dia.ventasCerradas),
    );
    await expect(page.locator('[data-testid="hoy-derivados"]')).toContainText(
      String(MOCK_DASHBOARD_DATA.dia.derivados),
    );
    await expect(page.locator('[data-testid="hoy-atenciones"]')).toContainText(
      String(MOCK_DASHBOARD_DATA.dia.atenciones),
    );
    // Contactabilidad real formateada como "68.0%"
    await expect(page.locator('[data-testid="hoy-contactabilidad"]')).toContainText('68');
    // Colaboradores activos / total
    await expect(page.locator('[data-testid="hoy-colaboradores"]')).toContainText(
      `${MOCK_DASHBOARD_DATA.dia.colaboradoresActivos} / ${MOCK_DASHBOARD_DATA.dia.colaboradoresTotal}`,
    );
    await expect(page.locator('[data-testid="hoy-citas"]')).toContainText(
      String(MOCK_DASHBOARD_DATA.dia.citasHoy),
    );

    // Banda MES existe
    await expect(page.locator('[data-testid="banda-mes"]')).toBeVisible();

    // KPIs MES
    await expect(page.locator('[data-testid="mes-ventas"]')).toContainText(
      String(MOCK_DASHBOARD_DATA.mes.ventasCerradas),
    );
    await expect(page.locator('[data-testid="mes-derivados"]')).toContainText(
      String(MOCK_DASHBOARD_DATA.mes.derivados),
    );
    // Tasa de conversion
    await expect(page.locator('[data-testid="mes-conversion"]')).toContainText('44');
    // Avance de bases
    await expect(page.locator('[data-testid="mes-avance-bases"]')).toContainText('61');
    // Disponibles sin asignar
    await expect(page.locator('[data-testid="mes-sin-asignar"]')).toContainText(
      String(MOCK_DASHBOARD_DATA.mes.disponiblesSinAsignar),
    );

    // Embudo visible con al menos el paso "asignados"
    await expect(page.locator('[data-testid="embudo-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="embudo-asignados"]')).toBeVisible();
    await expect(page.locator('[data-testid="embudo-ventas"]')).toBeVisible();

    // Tabla de bases
    await expect(page.locator('[data-testid="bases-section"]')).toBeVisible();
    const baseRows = page.locator('[data-testid="base-row"]');
    await expect(baseRows).toHaveCount(2);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/dashboard-dueno.png`,
      fullPage: true,
    });
  });

  // ── Caso 2: Ranking lista colaboradores; click → drill-down con prospectos ──

  test('ranking lista colaboradores; click en fila abre drill-down con prospectos del colaborador', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page);
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await irAlDashboard(page);

    // Ranking section visible
    await expect(page.locator('[data-testid="ranking-section"]')).toBeVisible();

    // Hay filas del ranking
    const rankingRows = page.locator('[data-testid="ranking-row"]');
    await expect(rankingRows).toHaveCount(MOCK_DASHBOARD_DATA.ranking.length);

    // Verifica que el primer colaborador aparece en la tabla
    await expect(rankingRows.first()).toContainText(MOCK_DASHBOARD_DATA.ranking[0].nombre);

    // Click en la primera fila del ranking → abre diálogo drill-down
    await rankingRows.first().click();

    // Diálogo visible
    const dialog = page.locator('app-teleoperador-prospectos-dialog');
    await expect(dialog).toBeVisible({ timeout: 8_000 });

    // Tabla de prospectos del drilldown se carga
    const drilldownTable = page.locator('[data-testid="drilldown-table"]');
    await expect(drilldownTable).toBeVisible({ timeout: 8_000 });

    // Verifica que los prospectos del mock aparecen
    await expect(drilldownTable).toContainText(MOCK_DRILLDOWN_RESULTADOS[0].nombreProspecto);
    // Teléfono enmascarado tal como lo manda el mock
    await expect(drilldownTable).toContainText(MOCK_DRILLDOWN_RESULTADOS[0].celular);

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/dashboard-drilldown.png`,
      fullPage: true,
    });
  });

  // ── Caso 3: Tarjeta "Por cerrar" muestra número y botón navega ──────────────

  test('tarjeta por cerrar muestra el numero y el boton navega a /admin/por-cerrar', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page, { porCerrar: 7 });
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await irAlDashboard(page);

    // Tarjeta por cerrar visible
    const porCerrarCard = page.locator('[data-testid="por-cerrar-card"]');
    await expect(porCerrarCard).toBeVisible();

    // Número correcto
    await expect(page.locator('[data-testid="por-cerrar-count"]')).toContainText('7');

    // Botón "Ir a Por cerrar"
    const btnIr = page.locator('[data-testid="btn-ir-por-cerrar"]');
    await expect(btnIr).toBeVisible();
    await expect(btnIr).toBeEnabled();

    // Navega a la ruta correcta
    await btnIr.click();
    await expect(page).toHaveURL(/\/admin\/por-cerrar/, { timeout: 5_000 });
  });

  // ── Caso 4: Error backend 500 → muestra mensaje, no crashea ─────────────────

  test('error backend 500 muestra mensaje de error y no crashea', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page, {
      fail: true,
      failStatus: 500,
      failMessage: 'Error interno del servidor.',
    });

    await page.goto('/admin/dashboard');

    // Spinner desaparece
    await expect(page.locator('[data-testid="dashboard-loading"]')).toBeHidden({ timeout: 8_000 });

    // Banner de error visible con texto real
    const errorBanner = page.locator('[data-testid="dashboard-error"]');
    await expect(errorBanner).toBeVisible({ timeout: 5_000 });

    // No muestra el contenido del dashboard
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeHidden();

    // Página no crashó: el layout del admin sigue visible
    await expect(page.locator('mat-sidenav-container')).toBeVisible();
  });

  // ── Caso 5: Error backend 400 → muestra mensaje, no crashea ─────────────────

  test('error backend 400 muestra mensaje de error y no crashea', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page, {
      fail: true,
      failStatus: 400,
      failMessage: 'Solicitud inválida.',
    });

    await page.goto('/admin/dashboard');

    await expect(page.locator('[data-testid="dashboard-loading"]')).toBeHidden({ timeout: 8_000 });
    await expect(page.locator('[data-testid="dashboard-error"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeHidden();
  });

});
