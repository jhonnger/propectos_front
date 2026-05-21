import { test, expect } from '@playwright/test';
import {
  mockBackend,
  mockMisProspectos,
  mockMiActividad,
  mockMisEstadisticas,
  mockApertura,
  mockCerrarApertura,
  mockHistorial,
  mockVerificacionSbs,
  mockRegistrarAtencion,
  mockPlantillaWhatsapp,
  mockTarjetaExiste,
  seedSession,
  MOCK_PROSPECTO_VENCIDO,
  MOCK_PROSPECTO_RECURRENTE,
  MOCK_PROSPECTO_NORMAL,
} from '../support/mocks';

/**
 * E2E — Cola del colaborador (RF-17, slice 1.2).
 *
 * Todos los casos usan mocks de red; no requieren backend real.
 */
test.describe('Cola del colaborador (TELEOPERADOR)', () => {

  test.beforeEach(async ({ page }) => {
    // Orden: catch-all primero, luego mocks específicos (LIFO de Playwright)
    await mockBackend(page, { rol: 'TELEOPERADOR' });
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page);
    await seedSession(page, 'TELEOPERADOR');
  });

  // ── Caso 1: carga inicial ──────────────────────────────────────────────────

  test('carga inicial: muestra "Mi cola de hoy", filas, teléfono enmascarado, fila vencida y badge recurrente', async ({ page }) => {
    await page.goto('/user/app/dashboard');

    // El chip activo por defecto debe ser "Mi cola de hoy"
    const chipActivo = page.locator('.filter-active');
    await expect(chipActivo).toContainText('Mi cola de hoy', { timeout: 8000 });

    // Deben aparecer las 3 filas mockeadas (tabla desktop)
    const rows = page.locator('tr.mat-mdc-row, tr.mdc-data-table__row');
    await expect(rows).toHaveCount(3, { timeout: 8000 });

    // Teléfono enmascarado: el texto debe contener asteriscos
    const celularCells = page.locator('tr.mat-mdc-row .phone-masked, tr.mdc-data-table__row');
    // Verificar en la celda de teléfono visible (tabla desktop) o en el markup del DOM
    const pageText = await page.content();
    expect(pageText).toContain('*');

    // Fila vencida: al menos una fila con clase row-vencido
    const filaVencida = page.locator('tr.row-vencido');
    await expect(filaVencida).toHaveCount(1);

    // Badge "Cliente recurrente" para el prospecto con préstamos concretados
    const badgeRecurrente = page.locator('.badge-recurrente').first();
    await expect(badgeRecurrente).toBeVisible();
    await expect(badgeRecurrente).toContainText('Cliente recurrente');

    await page.screenshot({
      path: 'test-results/screenshots/cola-hoy.png',
      fullPage: true,
    });
  });

  // ── Caso 2: cambio de filtro ───────────────────────────────────────────────

  test('cambiar a filtro "Sin gestionar" recarga y el request lleva filtro=SIN_GESTIONAR', async ({ page }) => {
    // Interceptar y capturar requests a mis-prospectos
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/asignaciones/mis-prospectos')) {
        requests.push(req.url());
      }
    });

    await page.goto('/user/app/dashboard');

    // Esperar la carga inicial
    await expect(page.locator('.filter-active')).toContainText('Mi cola de hoy', { timeout: 8000 });

    // Click en "Sin gestionar"
    const chipSinGestionar = page.locator('[data-filtro="SIN_GESTIONAR"]');
    await expect(chipSinGestionar).toBeVisible();
    await chipSinGestionar.click();

    // Esperar a que el filtro active cambie
    await expect(page.locator('.filter-active')).toContainText('Sin gestionar', { timeout: 5000 });

    // Verificar que algún request incluye filtro=SIN_GESTIONAR
    await page.waitForTimeout(600); // dar tiempo al debounce si aplica
    const hayFiltroRequest = requests.some((url) =>
      url.includes('filtro=SIN_GESTIONAR'),
    );
    expect(hayFiltroRequest).toBe(true);

    await page.screenshot({
      path: 'test-results/screenshots/cola-filtro-sin-gestionar.png',
      fullPage: true,
    });
  });

  // ── Caso 3: búsqueda con debounce ─────────────────────────────────────────

  test('búsqueda escribe texto y dispara request con busqueda=...', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/asignaciones/mis-prospectos')) {
        requests.push(req.url());
      }
    });

    await page.goto('/user/app/dashboard');
    await expect(page.locator('.filter-active')).toContainText('Mi cola de hoy', { timeout: 8000 });

    // Escribir en el campo de búsqueda
    const searchInput = page.locator('input[aria-label="Buscar prospectos"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Juan');

    // Esperar el debounce (~400ms) + margen
    await page.waitForTimeout(600);

    // Verificar que algún request incluye busqueda=Juan
    const hayBusqueda = requests.some((url) => url.includes('busqueda=Juan'));
    expect(hayBusqueda).toBe(true);

    await page.screenshot({
      path: 'test-results/screenshots/cola-busqueda.png',
      fullPage: true,
    });
  });

  // ── Caso 4: pestaña "Mi actividad de hoy" ─────────────────────────────────

  test('abrir "Mi actividad de hoy" muestra total y lista de gestiones', async ({ page }) => {
    await page.goto('/user/app/dashboard');

    // Esperar carga inicial
    await expect(page.locator('.filter-active')).toContainText('Mi cola de hoy', { timeout: 8000 });

    // Hacer click en la pestaña de actividad
    const tabActividad = page.getByRole('tab', { name: /Mi actividad de hoy/i });
    await expect(tabActividad).toBeVisible();
    await tabActividad.click();

    // Esperar que cargue el panel de actividad
    const actividadPanel = page.locator('[data-testid="actividad-panel"]');
    await expect(actividadPanel).toBeVisible({ timeout: 8000 });

    // Total de gestiones: 5 (del mock)
    await expect(actividadPanel.locator('.actividad-total-num')).toContainText('5');

    // Lista de gestiones: 2 items (del mock)
    const gestionItems = actividadPanel.locator('.gestion-item');
    await expect(gestionItems).toHaveCount(2);

    // Primer item contiene el nombre del prospecto
    await expect(gestionItems.first()).toContainText('Juan Quispe');

    await page.screenshot({
      path: 'test-results/screenshots/cola-actividad.png',
      fullPage: true,
    });
  });

  // ── Caso 5: error 400 del backend → mensaje visible ────────────────────────

  test('filtro rechazado por el backend (400) muestra el mensaje de error', async ({ page }) => {
    // Sobrescribir el mock de mis-prospectos para devolver 400 (registrar DESPUÉS)
    await mockMisProspectos(page, {
      fail: true,
      failMessage: 'Valor de filtro no reconocido: INVALIDO',
    });

    await page.goto('/user/app/dashboard');

    // El banner de error debe aparecer con el mensaje real
    const errorBanner = page.locator('[data-testid="error-banner"]');
    await expect(errorBanner).toBeVisible({ timeout: 8000 });
    await expect(errorBanner).toContainText('Valor de filtro no reconocido: INVALIDO');

    await page.screenshot({
      path: 'test-results/screenshots/cola-error-400.png',
      fullPage: true,
    });
  });

  // ── Caso 6: teléfono siempre enmascarado ──────────────────────────────────

  test('el teléfono se muestra enmascarado tal como lo envía el backend', async ({ page }) => {
    await page.goto('/user/app/dashboard');

    // Esperar carga
    await expect(page.locator('.filter-active')).toContainText('Mi cola de hoy', { timeout: 8000 });

    // Los celulares enmascarados ('******222', '***321', '*****321') deben estar
    // en el DOM (visibles o no, dependiendo del breakpoint). Verificar via HTML.
    const pageContent = await page.content();
    expect(pageContent).toContain('******222');
    expect(pageContent).toContain('***321');

    // Verificar que el texto de teléfono contiene asteriscos en los elementos de la tabla desktop
    // (el campo celular se muestra en la columna de nombre del desktop via documentoIdentidad,
    // y en la vista móvil via .phone-masked). Forzar visibilidad verificando el contenido completo.
    const maskedPhones = page.locator('.phone-masked');
    // Al menos un elemento .phone-masked debe existir en el DOM
    await expect(maskedPhones.first()).toBeAttached();

    // El contenido del primer elemento .phone-masked debe tener asteriscos
    const firstPhone = await maskedPhones.first().textContent();
    expect(firstPhone).toContain('*');
  });

  // ── Caso 7: botón de exportar NO está presente en la cola ─────────────────

  test('el botón de exportar Excel no está presente en la cola del colaborador', async ({ page }) => {
    await page.goto('/user/app/dashboard');
    await expect(page.locator('.filter-active')).toContainText('Mi cola de hoy', { timeout: 8000 });

    // No debe existir ningún botón de exportar en la toolbar de acciones del colaborador
    const btnExportar = page.locator('[data-testid="btn-exportar"], button[aria-label*="xportar"], button[aria-label*="escargar"]');
    await expect(btnExportar).toHaveCount(0);
  });

  // ── Caso 8: cola se recarga cuando wizard cierra con OBSERVADO ─────────────

  test('la cola se recarga cuando el wizard cierra con resultado OBSERVADO (SBS)', async ({ page }) => {
    // Fixture con celular sin máscara para el wizard
    const PROSPECTO_WIZARD = {
      ...MOCK_PROSPECTO_NORMAL,
      prospectoId: 88,
      asignacionId: 88,
      nombre: 'Testigo',
      apellido: 'ObservadoSbs',
      celular: '912345678',
      celularMasked: false,
    };

    const reloadRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/asignaciones/mis-prospectos')) {
        reloadRequests.push(req.url());
      }
    });

    // Registrar mocks del wizard DESPUÉS de los del beforeEach (LIFO)
    await mockMisProspectos(page, { resultados: [PROSPECTO_WIZARD] });
    await mockApertura(page, { aperturaId: 55 });
    await mockCerrarApertura(page);
    await mockHistorial(page);
    await mockVerificacionSbs(page, { resultado: 'OBSERVADO', fechaReevaluacionSbs: '2026-09-01' });
    await mockRegistrarAtencion(page);
    await mockPlantillaWhatsapp(page);
    await mockTarjetaExiste(page, { existe: false });

    await page.goto('/user/app/dashboard');
    await expect(page.locator('tr.mat-mdc-row, tr.mdc-data-table__row').first()).toBeVisible({ timeout: 10000 });

    // Limpiar requests previas (carga inicial) para medir solo las del refresh
    reloadRequests.length = 0;

    // Abrir wizard
    const btnGestionar = page.locator('button[aria-label="Gestionar prospecto"]').first();
    await expect(btnGestionar).toBeEnabled({ timeout: 5000 });
    await btnGestionar.click();
    await expect(page.locator('[data-testid="sbs-section"]')).toBeVisible({ timeout: 8000 });

    // Marcar SBS OBSERVADO → el modal se auto-cierra
    await page.locator('[data-testid="btn-sbs-observado"]').click();
    await expect(page.locator('[data-testid="sbs-section"]')).not.toBeVisible({ timeout: 8000 });

    // Tras cerrarse el wizard, la cola debe haber recargado
    await page.waitForTimeout(500);
    expect(reloadRequests.length).toBeGreaterThan(0);
  });

});
