import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockDashboardAdmin,
  mockColaboradorDrilldown,
  mockExportarProspectos,
  seedSession,
  MOCK_DASHBOARD_DATA,
  MOCK_DRILLDOWN_RESULTADOS,
  AsistenciaDiaMock,
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

  // ── Caso 3: "Por cerrar" eliminado — el dashboard NO muestra esa tarjeta ─────

  test('la tarjeta por-cerrar ya no existe en el dashboard (CF-1: funcionalidad eliminada)', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page);
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await irAlDashboard(page);

    // El dashboard sigue cargando sin errores
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

    // La tarjeta "Por cerrar" ya no existe
    await expect(page.locator('[data-testid="por-cerrar-card"]')).toHaveCount(0);

    // La métrica "Prospectos cerrados" está visible en la banda HOY
    await expect(page.locator('[data-testid="hoy-ventas"]')).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/dashboard-sin-por-cerrar.png`,
      fullPage: true,
    });
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

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard del dueno — Slice 2.4: Asistencia del dia + En riesgo', () => {

  // ── Caso 1: Sección asistencia visible, colaboradores presentes y ausentes ──

  test('muestra seccion asistencia con colaborador presente y ausente', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page);
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await irAlDashboard(page);

    // Heading visible
    const asistenciaSection = page.locator('[data-testid="asistencia-section"]');
    await expect(asistenciaSection).toBeVisible();
    await expect(asistenciaSection.locator('h3')).toContainText('Asistencia de hoy');

    // Tabla de asistencia existe
    const tabla = page.locator('[data-testid="asistencia-table"]');
    await expect(tabla).toBeVisible();

    // Resumen de ausentes
    const ausentesCount = page.locator('[data-testid="ausentes-count"]');
    await expect(ausentesCount).toContainText(
      String(MOCK_DASHBOARD_DATA.asistencia.totalAusentes),
    );

    // Filas de la tabla (2 colaboradores en el mock)
    const filas = page.locator('[data-testid="asistencia-row"]');
    await expect(filas).toHaveCount(MOCK_DASHBOARD_DATA.asistencia.colaboradores.length);

    // Colaborador ausente (Luis Gomez) → chip "Ausente"
    const chipAusente = page.locator('[data-testid="chip-ausente"]');
    await expect(chipAusente).toBeVisible();
    await expect(chipAusente).toContainText('Ausente');

    // Colaborador presente (Ana Perez) → chip "Presente"
    const chipPresente = page.locator('[data-testid="chip-presente"]');
    await expect(chipPresente).toBeVisible();
    await expect(chipPresente).toContainText('Presente');
  });

  // ── Caso 2: Badge "En riesgo" muestra 4 y enlaza a /admin/reasignacion ──────

  test('badge en riesgo muestra el recuento y navega a /admin/reasignacion', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page, { porEnRiesgo: 4 });
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await irAlDashboard(page);

    const enRiesgoCard = page.locator('[data-testid="en-riesgo-card"]');
    await expect(enRiesgoCard).toBeVisible();

    // El número muestra 4
    await expect(page.locator('[data-testid="en-riesgo-count"]')).toContainText('4');

    // Botón navega a la pantalla de reasignación
    const btnReasignacion = page.locator('[data-testid="btn-ir-reasignacion"]');
    await expect(btnReasignacion).toBeVisible();
    await expect(btnReasignacion).toBeEnabled();
    await btnReasignacion.click();
    await expect(page).toHaveURL(/\/admin\/reasignacion/, { timeout: 5_000 });
  });

  // ── Caso 3: esLaborable=false → nota "Hoy no es día laborable." ─────────────

  test('cuando esLaborable es false muestra nota sin tabla', async ({ page }) => {
    await setup(page);
    const asistenciaNoLaborable: AsistenciaDiaMock = {
      esLaborable: false,
      fecha: '2026-05-17',
      totalColaboradores: 0,
      totalAusentes: 0,
      colaboradores: [],
    };
    await mockDashboardAdmin(page, { asistencia: asistenciaNoLaborable });
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await irAlDashboard(page);

    // La nota "no laborable" es visible
    const nota = page.locator('[data-testid="no-laborable-note"]');
    await expect(nota).toBeVisible();
    await expect(nota).toContainText('Hoy no es día laborable.');

    // La tabla de asistencia NO se muestra
    await expect(page.locator('[data-testid="asistencia-table"]')).toBeHidden();
  });

  // ── Caso 4: screenshot completo del dashboard con asistencia ─────────────────

  test('screenshot completo del dashboard con bloque asistencia y en riesgo', async ({ page }) => {
    await setup(page);
    await mockDashboardAdmin(page);
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await irAlDashboard(page);

    // Esperar que los elementos de asistencia sean visibles
    await expect(page.locator('[data-testid="asistencia-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="en-riesgo-card"]')).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/dashboard-asistencia-en-riesgo.png`,
      fullPage: true,
    });
  });

});
