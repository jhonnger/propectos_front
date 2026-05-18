/**
 * manual-capture.spec.ts
 *
 * Script Playwright de captura de pantallas para el manual de usuario.
 * NO valida comportamiento: solo navega y guarda PNGs.
 *
 * Salida:
 *   docs/manual/img/admin/  — capturas del perfil ADMINISTRADOR
 *   docs/manual/img/colab/  — capturas del perfil TELEOPERADOR
 *
 * Ejecucion:
 *   npx playwright test e2e/manual/manual-capture.spec.ts
 *
 * Reutiliza todos los helpers de e2e/support/mocks.ts (sin backend real).
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import {
  mockBackend,
  mockDashboardAdmin,
  mockColaboradorDrilldown,
  mockExportarProspectos,
  mockImportarExcel,
  mockAsignacionMulti,
  mockUsuariosNoAdmins,
  mockConfiguracion,
  mockEstadoEmail,
  mockCalendario,
  mockEnRiesgo,
  mockReasignar,
  mockBitacora,
  mockPorCerrar,
  mockRegistrarVenta,
  mockMisProspectos,
  mockMiActividad,
  mockMisEstadisticas,
  mockApertura,
  mockCerrarApertura,
  mockHistorial,
  mockVerificacionSbs,
  mockRegistrarAtencion,
  mockJornada,
  seedSession,
  MOCK_FERIADOS_DEFAULT,
  MOCK_EN_RIESGO_ITEMS,
  MOCK_CONFIGURACION_DEFAULT,
  MOCK_POR_CERRAR_NORMAL,
  MOCK_POR_CERRAR_RECURRENTE,
  MOCK_PROSPECTO_NORMAL,
} from '../support/mocks';

// ── Rutas de salida absolutas (funciona sin importar el cwd de Playwright) ──

const ADMIN_DIR = path.resolve(__dirname, '../../docs/manual/img/admin');
const COLAB_DIR = path.resolve(__dirname, '../../docs/manual/img/colab');

// Viewport constante para todas las capturas
const VIEWPORT = { width: 1366, height: 900 };

// ── Fixtures de datos realistas en espanol ──────────────────────────────────

/** Prospectos realistas para la cola del colaborador */
const PROSPECTOS_MANUAL = [
  {
    asignacionId: 101,
    prospectoId: 201,
    nombre: 'Santiago',
    apellido: 'Vilchez Ramos',
    celular: '******847',
    celularMasked: true,
    documentoIdentidad: '*****312',
    campania: 'Campana Mayo 2026',
    estado: 'EN_SEGUIMIENTO',
    estadoResultado: 'NO_CONTESTO',
    fechaAgenda: null,
    verificacionSbs: null,
    fechaReevaluacionSbs: null,
    proximaLlamada: null,
    intentosFallidos: 2,
    ultimoContacto: '2026-05-15T10:30:00',
    totalContactos: 3,
    nroPrestamosConcretados: 0,
    vencido: true,
    futuro: false,
  },
  {
    asignacionId: 102,
    prospectoId: 202,
    nombre: 'Carmen Rosa',
    apellido: 'Huayta Flores',
    celular: '***928',
    celularMasked: true,
    documentoIdentidad: '*****741',
    campania: 'Campana Mayo 2026',
    estado: 'EN_SEGUIMIENTO',
    estadoResultado: 'AGENDADO',
    fechaAgenda: '2026-05-20T14:00:00',
    verificacionSbs: 'APTO',
    fechaReevaluacionSbs: null,
    proximaLlamada: null,
    intentosFallidos: 0,
    ultimoContacto: '2026-05-17T09:00:00',
    totalContactos: 5,
    nroPrestamosConcretados: 2,
    vencido: false,
    futuro: false,
  },
  {
    asignacionId: 103,
    prospectoId: 203,
    nombre: 'Luis Alberto',
    apellido: 'Condori Mamani',
    celular: '*****063',
    celularMasked: true,
    documentoIdentidad: '*****509',
    campania: 'Campana Abril 2026',
    estado: 'PENDIENTE',
    estadoResultado: null,
    fechaAgenda: null,
    verificacionSbs: null,
    fechaReevaluacionSbs: null,
    proximaLlamada: null,
    intentosFallidos: 0,
    ultimoContacto: null,
    totalContactos: 0,
    nroPrestamosConcretados: 0,
    vencido: false,
    futuro: false,
  },
  {
    asignacionId: 104,
    prospectoId: 204,
    nombre: 'Maria Elena',
    apellido: 'Torres Quispe',
    celular: '******391',
    celularMasked: true,
    documentoIdentidad: '*****182',
    campania: 'Campana Mayo 2026',
    estado: 'EN_SEGUIMIENTO',
    estadoResultado: 'INTERESADO',
    fechaAgenda: '2026-05-22T10:00:00',
    verificacionSbs: 'APTO',
    fechaReevaluacionSbs: null,
    proximaLlamada: null,
    intentosFallidos: 0,
    ultimoContacto: '2026-05-16T11:30:00',
    totalContactos: 2,
    nroPrestamosConcretados: 1,
    vencido: false,
    futuro: false,
  },
];

/** Prospecto para el wizard de atencion */
const PROSPECTO_WIZARD = {
  ...MOCK_PROSPECTO_NORMAL,
  asignacionId: 200,
  prospectoId: 300,
  nombre: 'Roberto',
  apellido: 'Salazar Paredes',
  celular: '******754',
  documentoIdentidad: '*****623',
  campania: 'Campana Mayo 2026',
  estado: 'EN_SEGUIMIENTO',
  estadoResultado: null,
};

// ── Helpers compartidos ──────────────────────────────────────────────────────

/** Configura el viewport a 1366x900 antes de cada test. */
async function setViewport(page: Page): Promise<void> {
  await page.setViewportSize(VIEWPORT);
}

/** Siembra sesion admin y registra mocks base para el perfil ADMINISTRADOR. */
async function setupAdmin(page: Page): Promise<void> {
  await setViewport(page);
  await mockBackend(page, { rol: 'ADMINISTRADOR' });
  await seedSession(page, 'ADMINISTRADOR');
}

/** Siembra sesion teleoperador y registra mocks base para colaborador. */
async function setupColaborador(page: Page): Promise<void> {
  await setViewport(page);
  await mockBackend(page, { rol: 'TELEOPERADOR' });
  await seedSession(page, 'TELEOPERADOR');
}

/**
 * Navega al dashboard colaborador y abre el wizard de atencion
 * para el primer prospecto de la cola.
 * Retorna solo cuando el panel SBS esta visible (wizard abierto).
 */
async function abrirWizardColaborador(page: Page): Promise<void> {
  await page.goto('/user/app/dashboard');
  await expect(page.locator('tr.mat-mdc-row, tr.mdc-data-table__row').first()).toBeVisible({
    timeout: 12_000,
  });
  const btnGestionar = page.locator('button[aria-label="Gestionar prospecto"]').first();
  await expect(btnGestionar).toBeEnabled({ timeout: 5_000 });
  await btnGestionar.click();
  await expect(page.locator('[data-testid="sbs-section"]')).toBeVisible({ timeout: 8_000 });
}

// ── Grupo ADMINISTRADOR ──────────────────────────────────────────────────────

test.describe('Manual — Admin', () => {

  // ── 01-login.png ────────────────────────────────────────────────────────────

  test('01-login', async ({ page }) => {
    await setViewport(page);
    await mockBackend(page);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Polaris CRM' })).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: `${ADMIN_DIR}/01-login.png`,
    });
  });

  // ── 02-dashboard.png ────────────────────────────────────────────────────────

  test('02-dashboard', async ({ page }) => {
    await setupAdmin(page);
    await mockDashboardAdmin(page);
    await mockColaboradorDrilldown(page);
    await mockExportarProspectos(page);

    await page.goto('/admin/dashboard');
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible({ timeout: 12_000 });
    // Esperar que los bloques clave esten presentes
    await expect(page.locator('[data-testid="banda-hoy"]')).toBeVisible();
    await expect(page.locator('[data-testid="asistencia-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="en-riesgo-card"]')).toBeVisible();

    await page.screenshot({
      path: `${ADMIN_DIR}/02-dashboard.png`,
      fullPage: true,
    });
  });

  // ── 03-upload-excel.png ─────────────────────────────────────────────────────

  test('03-upload-excel', async ({ page }) => {
    await setupAdmin(page);
    await mockImportarExcel(page, {
      importados: 47,
      rechazados: 3,
      detalleRechazos: [
        { fila: 12, motivo: 'Celular duplicado en la base' },
        { fila: 28, motivo: 'Campos obligatorios faltantes: nombre' },
        { fila: 45, motivo: 'Formato de documento invalido' },
      ],
    });

    await page.goto('/admin/upload-excel');
    // La pantalla carga el formulario de subida
    await expect(page.locator('input[type="file"]')).toBeAttached({ timeout: 10_000 });

    await page.screenshot({
      path: `${ADMIN_DIR}/03-upload-excel.png`,
      fullPage: true,
    });
  });

  // ── 04-assign-prospects.png ─────────────────────────────────────────────────

  test('04-assign-prospects', async ({ page }) => {
    await setupAdmin(page);
    await mockAsignacionMulti(
      page,
      {
        id: 1,
        nombrearchivo: 'base_mayo_2026.xlsx',
        prospectosSinAsignar: 52,
        cantidadProspectos: 120,
      },
      {},
    );

    await page.goto('/admin/assign-prospects');
    // Esperar que aparezca el nombre del archivo en la tabla
    await expect(page.locator('.load-filename').first()).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: `${ADMIN_DIR}/04-assign-prospects.png`,
      fullPage: true,
    });
  });

  // ── 05-manage-users.png ─────────────────────────────────────────────────────

  test('05-manage-users', async ({ page }) => {
    await setupAdmin(page);
    // Mock de GET /api/usuarios/activos con datos realistas
    await page.route('**/api/usuarios/activos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            nombre: 'Ana',
            apellidos: 'Perez Gutierrez',
            usuario: 'aperez',
            email: 'ana.perez@polariscrm.com',
            estado: true,
            nombreCompleto: 'Ana Perez Gutierrez',
            rolId: 1,
            rolNombre: 'ADMINISTRADOR',
          },
          {
            id: 2,
            nombre: 'Santiago',
            apellidos: 'Vilchez Ramos',
            usuario: 'svilchez',
            email: 'santiago.vilchez@polariscrm.com',
            estado: true,
            nombreCompleto: 'Santiago Vilchez Ramos',
            rolId: 2,
            rolNombre: 'TELEOPERADOR',
          },
          {
            id: 3,
            nombre: 'Carmen Rosa',
            apellidos: 'Huayta Flores',
            usuario: 'chuayta',
            email: 'carmen.huayta@polariscrm.com',
            estado: true,
            nombreCompleto: 'Carmen Rosa Huayta Flores',
            rolId: 2,
            rolNombre: 'TELEOPERADOR',
          },
          {
            id: 4,
            nombre: 'Luis Alberto',
            apellidos: 'Condori Mamani',
            usuario: 'lcondori',
            email: 'luis.condori@polariscrm.com',
            estado: false,
            nombreCompleto: 'Luis Alberto Condori Mamani',
            rolId: 2,
            rolNombre: 'TELEOPERADOR',
          },
        ]),
      });
    });

    await page.goto('/admin/manage-users');
    // Esperar que la tabla cargue al menos una fila
    await expect(page.locator('mat-row, tr.mat-mdc-row, tr.mdc-data-table__row').first()).toBeVisible({
      timeout: 12_000,
    });

    await page.screenshot({
      path: `${ADMIN_DIR}/05-manage-users.png`,
      fullPage: true,
    });
  });

  // ── 06-user-dialog.png ──────────────────────────────────────────────────────

  test('06-user-dialog', async ({ page }) => {
    await setupAdmin(page);
    // Mismo mock de usuarios activos para que la pagina cargue
    await page.route('**/api/usuarios/activos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 2,
            nombre: 'Santiago',
            apellidos: 'Vilchez Ramos',
            usuario: 'svilchez',
            email: 'santiago.vilchez@polariscrm.com',
            estado: true,
            nombreCompleto: 'Santiago Vilchez Ramos',
            rolId: 2,
            rolNombre: 'TELEOPERADOR',
          },
        ]),
      });
    });
    // Mock de roles para el formulario del dialogo
    await page.route('**/api/usuarios/roles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, nombre: 'ADMINISTRADOR' },
          { id: 2, nombre: 'TELEOPERADOR' },
        ]),
      });
    });

    await page.goto('/admin/manage-users');
    await expect(page.locator('mat-row, tr.mat-mdc-row, tr.mdc-data-table__row').first()).toBeVisible({
      timeout: 12_000,
    });

    // Abrir el dialogo de nuevo usuario via el boton principal
    // Buscar el boton "Nuevo Usuario" o similar en la pagina
    const btnNuevo = page.locator('button').filter({ hasText: /nuevo usuario|agregar|crear/i }).first();
    await expect(btnNuevo).toBeVisible({ timeout: 5_000 });
    await btnNuevo.click();

    // Esperar que el dialogo de Angular Material este abierto (usar el container externo)
    const dialog = page.locator('mat-dialog-container').first();
    await expect(dialog).toBeVisible({ timeout: 8_000 });

    await page.screenshot({
      path: `${ADMIN_DIR}/06-user-dialog.png`,
      fullPage: true,
    });
  });

  // ── 07-configuracion.png ────────────────────────────────────────────────────

  test('07-configuracion', async ({ page }) => {
    await setupAdmin(page);
    await mockEstadoEmail(page, { mailConfigurado: true, ok: true });
    await mockConfiguracion(page, {
      config: {
        ...MOCK_CONFIGURACION_DEFAULT,
        toggleEmailInstantaneo: true,
        toggleResumenDiario: true,
        metaVentasMensual: 30,
        metaDerivadosPorColaborador: 8,
      },
    });

    await page.goto('/admin/configuracion');
    await expect(page.locator('[data-testid="config-content"]')).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: `${ADMIN_DIR}/07-configuracion.png`,
      fullPage: true,
    });
  });

  // ── 08-calendario.png ───────────────────────────────────────────────────────

  test('08-calendario', async ({ page }) => {
    await setupAdmin(page);
    await mockCalendario(page, {
      feriados: [
        ...MOCK_FERIADOS_DEFAULT,
        { id: 4, fecha: '2026-06-29', esFeriado: true, descripcion: 'San Pedro y San Pablo' },
        { id: 5, fecha: '2026-07-29', esFeriado: true, descripcion: 'Fiestas Patrias (2do dia)' },
        { id: 6, fecha: '2026-08-30', esFeriado: true, descripcion: 'Santa Rosa de Lima' },
        { id: 7, fecha: '2026-10-08', esFeriado: true, descripcion: 'Combate de Angamos' },
        { id: 8, fecha: '2026-11-01', esFeriado: true, descripcion: 'Todos los Santos' },
        { id: 9, fecha: '2026-12-08', esFeriado: true, descripcion: 'Inmaculada Concepcion' },
        { id: 10, fecha: '2026-12-25', esFeriado: true, descripcion: 'Navidad' },
      ],
    });

    await page.goto('/admin/calendario');
    await expect(page.locator('[data-testid="calendario-content"]')).toBeVisible({ timeout: 10_000 });
    // Esperar que las filas esten presentes
    await expect(page.locator('[data-testid="feriado-row"]').first()).toBeVisible({ timeout: 8_000 });

    await page.screenshot({
      path: `${ADMIN_DIR}/08-calendario.png`,
      fullPage: true,
    });
  });

  // ── 09-reasignacion.png ─────────────────────────────────────────────────────

  test('09-reasignacion', async ({ page }) => {
    await setupAdmin(page);
    await mockEnRiesgo(page, {
      resultados: [
        ...MOCK_EN_RIESGO_ITEMS,
        {
          asignacionId: 3,
          prospectoId: 3,
          nombre: 'Fabian Quispe',
          celular: '*****202',
          campania: 'Campana Mayo 2026',
          estado: 'EN_SEGUIMIENTO',
          fechaAgenda: '2026-05-18T14:00:00',
          colaboradorAusenteId: 2,
          colaboradorAusente: 'Col c1',
        },
      ],
      total: 3,
    });
    await mockUsuariosNoAdmins(page);
    await mockReasignar(page);

    await page.goto('/admin/reasignacion');
    await expect(page.locator('[data-testid="total-en-riesgo"]')).toBeVisible({ timeout: 10_000 });
    // Esperar que loading desaparezca
    await expect(page.locator('[role="status"]')).not.toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: `${ADMIN_DIR}/09-reasignacion.png`,
      fullPage: true,
    });
  });

  // ── 10-bitacora.png ─────────────────────────────────────────────────────────

  test('10-bitacora', async ({ page }) => {
    await setupAdmin(page);
    await mockBitacora(page, {
      resultados: [
        {
          contactoId: 1,
          asignacionId: 10,
          prospectoId: 20,
          fecha: '2026-05-17T14:03:00',
          colaborador: 'Santiago Vilchez',
          prospecto: 'Pedro Ramirez Cruz',
          celular: '*****789',
          campania: 'Campana Mayo 2026',
          base: 'base_mayo_2026.xlsx',
          estadoResultado: 'NO_CONTESTO',
          submotivoNoContesto: 'BUZON',
          quienContesto: null,
          verificacionSbs: 'APTO',
          duracionGestion: 125,
          comentario: 'Dejo mensaje en buzon',
        },
        {
          contactoId: 2,
          asignacionId: 11,
          prospectoId: 21,
          fecha: '2026-05-17T15:20:00',
          colaborador: 'Carmen Rosa Huayta',
          prospecto: 'Rosa Mendez Lazo',
          celular: '*****456',
          campania: 'Campana Abril 2026',
          base: 'base_abril_2026.xlsx',
          estadoResultado: 'AGENDADO',
          submotivoNoContesto: null,
          quienContesto: 'TITULAR',
          verificacionSbs: 'APTO',
          duracionGestion: 240,
          comentario: 'Cita para el lunes a las 10am',
        },
        {
          contactoId: 3,
          asignacionId: 12,
          prospectoId: 22,
          fecha: '2026-05-18T09:45:00',
          colaborador: 'Santiago Vilchez',
          prospecto: 'Jorge Flores Rivas',
          celular: '*****123',
          campania: 'Campana Mayo 2026',
          base: 'base_mayo_2026.xlsx',
          estadoResultado: 'INTERESADO',
          submotivoNoContesto: null,
          quienContesto: 'TITULAR',
          verificacionSbs: 'APTO',
          duracionGestion: 310,
          comentario: 'Muy interesado, seguimiento en 3 dias',
        },
        {
          contactoId: 4,
          asignacionId: 13,
          prospectoId: 23,
          fecha: '2026-05-18T10:30:00',
          colaborador: 'Carmen Rosa Huayta',
          prospecto: 'Elena Gutierrez Vega',
          celular: '***891',
          campania: 'Campana Mayo 2026',
          base: 'base_mayo_2026.xlsx',
          estadoResultado: 'DERIVADO',
          submotivoNoContesto: null,
          quienContesto: 'TITULAR',
          verificacionSbs: 'APTO',
          duracionGestion: 450,
          comentario: 'Derivado al cierre',
        },
      ],
      total: 4,
    });
    await mockUsuariosNoAdmins(page);

    await page.goto('/admin/bitacora');
    await expect(page.locator('[data-testid="bitacora-heading"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[role="status"][aria-label="Cargando bitácora"]')).not.toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('[data-testid="fila-colaborador"]').first()).toBeVisible({
      timeout: 8_000,
    });

    await page.screenshot({
      path: `${ADMIN_DIR}/10-bitacora.png`,
      fullPage: true,
    });
  });

  // ── 11-por-cerrar.png ───────────────────────────────────────────────────────

  test('11-por-cerrar', async ({ page }) => {
    await setupAdmin(page);
    await mockPorCerrar(page, {
      resultados: [
        {
          asignacionId: 10,
          prospectoId: 10,
          nombre: 'Cesar',
          apellido: 'Palomino Rios',
          celular: '******000',
          celularMasked: true,
          documentoIdentidad: '*****001',
          campania: 'Campana Mayo 2026',
          derivadoPorId: 2,
          derivadoPorNombre: 'Santiago Vilchez',
          fechaDerivacion: '2026-05-17T10:00:00',
          nroPrestamosConcretados: 0,
        },
        {
          asignacionId: 11,
          prospectoId: 11,
          nombre: 'Norma',
          apellido: 'Vasquez Torres',
          celular: '******111',
          celularMasked: true,
          documentoIdentidad: '*****002',
          campania: 'Campana Abril 2026',
          derivadoPorId: 3,
          derivadoPorNombre: 'Carmen Rosa Huayta',
          fechaDerivacion: '2026-05-16T14:30:00',
          nroPrestamosConcretados: 3,
        },
        MOCK_POR_CERRAR_NORMAL,
        MOCK_POR_CERRAR_RECURRENTE,
      ],
      total: 4,
    });
    await mockRegistrarVenta(page);

    await page.goto('/admin/por-cerrar');
    await expect(page.locator('[data-testid="btn-cerrar-caso"]').first()).toBeVisible({
      timeout: 10_000,
    });

    await page.screenshot({
      path: `${ADMIN_DIR}/11-por-cerrar.png`,
      fullPage: true,
    });
  });

  // ── 12-cerrar-venta.png ─────────────────────────────────────────────────────

  test('12-cerrar-venta', async ({ page }) => {
    await setupAdmin(page);
    await mockPorCerrar(page, {
      resultados: [MOCK_POR_CERRAR_NORMAL, MOCK_POR_CERRAR_RECURRENTE],
      total: 2,
    });
    await mockRegistrarVenta(page);

    await page.goto('/admin/por-cerrar');
    await expect(page.locator('[data-testid="btn-cerrar-caso"]').first()).toBeVisible({
      timeout: 10_000,
    });

    // Abrir el dialogo de cierre de venta del primer caso
    await page.locator('[data-testid="btn-cerrar-caso"]').first().click();
    // Esperar que el dialogo este abierto (el campo de fecha es la senyal)
    await expect(page.locator('[data-testid="btn-confirmar-cierre"]')).toBeVisible({
      timeout: 6_000,
    });
    // Pre-llenar fecha para que el dialogo se vea completo
    const fechaInput = page.locator('[data-testid="input-fecha-elegibilidad"]');
    if (await fechaInput.isVisible()) {
      await fechaInput.fill('2026-12-01');
    }

    await page.screenshot({
      path: `${ADMIN_DIR}/12-cerrar-venta.png`,
      fullPage: true,
    });
  });

});

// ── Grupo COLABORADOR ────────────────────────────────────────────────────────

test.describe('Manual — Colaborador', () => {

  // ── 01-cola.png ─────────────────────────────────────────────────────────────

  test('01-cola', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: PROSPECTOS_MANUAL, total: PROSPECTOS_MANUAL.length });
    await mockJornada(page);

    await page.goto('/user/app/dashboard');
    await expect(page.locator('tr.mat-mdc-row, tr.mdc-data-table__row').first()).toBeVisible({
      timeout: 12_000,
    });

    await page.screenshot({
      path: `${COLAB_DIR}/01-cola.png`,
      fullPage: true,
    });
  });

  // ── 02-wizard-apertura.png ──────────────────────────────────────────────────

  test('02-wizard-apertura', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: [PROSPECTO_WIZARD] });
    await mockApertura(page, { aperturaId: 42 });
    await mockCerrarApertura(page);
    await mockHistorial(page, {
      items: [
        {
          fechaContacto: '2026-05-10T10:30:00',
          resultado: 'NO_CONTESTO',
          submotivoNoContesto: 'NO_CONTESTA',
          quienContesto: null,
          verificacionSbs: null,
          comentario: 'Sin respuesta.',
          duracionGestion: 45,
        },
        {
          fechaContacto: '2026-05-14T15:00:00',
          resultado: 'NO_CONTESTO',
          submotivoNoContesto: 'BUZON',
          quienContesto: null,
          verificacionSbs: null,
          comentario: 'Buzon de voz.',
          duracionGestion: 30,
        },
      ],
    });
    await mockVerificacionSbs(page, { resultado: 'APTO' });
    await mockRegistrarAtencion(page);
    await seedSession(page, 'TELEOPERADOR');

    await abrirWizardColaborador(page);

    await page.screenshot({
      path: `${COLAB_DIR}/02-wizard-apertura.png`,
    });
  });

  // ── 03-wizard-sbs-apto.png ──────────────────────────────────────────────────

  test('03-wizard-sbs-apto', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: [PROSPECTO_WIZARD] });
    await mockApertura(page, { aperturaId: 42 });
    await mockCerrarApertura(page);
    await mockHistorial(page);
    await mockVerificacionSbs(page, { resultado: 'APTO' });
    await mockRegistrarAtencion(page);
    await seedSession(page, 'TELEOPERADOR');

    await abrirWizardColaborador(page);

    // Hacer click en APTO para avanzar al paso 1
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 6_000 });

    await page.screenshot({
      path: `${COLAB_DIR}/03-wizard-sbs-apto.png`,
    });
  });

  // ── 04-wizard-contesto.png ──────────────────────────────────────────────────

  test('04-wizard-contesto', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: [PROSPECTO_WIZARD] });
    await mockApertura(page, { aperturaId: 42 });
    await mockCerrarApertura(page);
    await mockHistorial(page);
    await mockVerificacionSbs(page, { resultado: 'APTO' });
    await mockRegistrarAtencion(page);
    await seedSession(page, 'TELEOPERADOR');

    await abrirWizardColaborador(page);

    // SBS APTO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 6_000 });

    // Ahora el wizard de llamada esta desbloqueado; capturar paso "Contesto?"
    await expect(page.locator('[data-testid="btn-contesto"]')).toBeVisible({ timeout: 5_000 });

    await page.screenshot({
      path: `${COLAB_DIR}/04-wizard-contesto.png`,
    });
  });

  // ── 05-wizard-quien.png ─────────────────────────────────────────────────────

  test('05-wizard-quien', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: [PROSPECTO_WIZARD] });
    await mockApertura(page, { aperturaId: 42 });
    await mockCerrarApertura(page);
    await mockHistorial(page);
    await mockVerificacionSbs(page, { resultado: 'APTO' });
    await mockRegistrarAtencion(page);
    await seedSession(page, 'TELEOPERADOR');

    await abrirWizardColaborador(page);

    // SBS APTO → Contesto
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 6_000 });
    await page.locator('[data-testid="btn-contesto"]').click();

    // Esperar el paso "Quien contesto?" (titular / tercero / equivocado)
    await expect(page.locator('[data-testid="btn-quien-titular"]')).toBeVisible({ timeout: 5_000 });

    await page.screenshot({
      path: `${COLAB_DIR}/05-wizard-quien.png`,
    });
  });

  // ── 06-wizard-resultados.png ────────────────────────────────────────────────

  test('06-wizard-resultados', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: [PROSPECTO_WIZARD] });
    await mockApertura(page, { aperturaId: 42 });
    await mockCerrarApertura(page);
    await mockHistorial(page);
    await mockVerificacionSbs(page, { resultado: 'APTO' });
    await mockRegistrarAtencion(page);
    await seedSession(page, 'TELEOPERADOR');

    await abrirWizardColaborador(page);

    // SBS APTO → Contesto → Titular → llegar al paso de resultado
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 6_000 });
    await page.locator('[data-testid="btn-contesto"]').click();
    await page.locator('[data-testid="btn-quien-titular"]').click();

    // Esperar que aparezcan las opciones de resultado (al menos una visible)
    await expect(page.locator('[data-testid="titular-op-INTERESADO"]')).toBeVisible({
      timeout: 5_000,
    });

    await page.screenshot({
      path: `${COLAB_DIR}/06-wizard-resultados.png`,
    });
  });

  // ── 07-wizard-interesado.png ────────────────────────────────────────────────

  test('07-wizard-interesado', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: [PROSPECTO_WIZARD] });
    await mockApertura(page, { aperturaId: 42 });
    await mockCerrarApertura(page);
    await mockHistorial(page);
    await mockVerificacionSbs(page, { resultado: 'APTO' });
    await mockRegistrarAtencion(page);
    await seedSession(page, 'TELEOPERADOR');

    await abrirWizardColaborador(page);

    // SBS APTO → Contesto → Titular → INTERESADO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 6_000 });
    await page.locator('[data-testid="btn-contesto"]').click();
    await page.locator('[data-testid="btn-quien-titular"]').click();
    await page.locator('[data-testid="titular-op-INTERESADO"]').click();

    // Esperar que aparezca el bloque de agenda con fecha pre-llenada
    await expect(page.locator('[data-testid="agenda-section"]')).toBeVisible({ timeout: 5_000 });
    // El hint de "Seguimiento sugerido" confirma que la fecha esta pre-llenada
    await expect(page.locator('[data-testid="interesado-agenda-hint"]')).toBeVisible({
      timeout: 3_000,
    });

    await page.screenshot({
      path: `${COLAB_DIR}/07-wizard-interesado.png`,
    });
  });

  // ── 08-wizard-agendar.png ───────────────────────────────────────────────────

  test('08-wizard-agendar', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: [PROSPECTO_WIZARD] });
    await mockApertura(page, { aperturaId: 42 });
    await mockCerrarApertura(page);
    await mockHistorial(page);
    await mockVerificacionSbs(page, { resultado: 'APTO' });
    await mockRegistrarAtencion(page);
    await seedSession(page, 'TELEOPERADOR');

    await abrirWizardColaborador(page);

    // SBS APTO → Contesto → Titular → AGENDADO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 6_000 });
    await page.locator('[data-testid="btn-contesto"]').click();
    await page.locator('[data-testid="btn-quien-titular"]').click();
    await page.locator('[data-testid="titular-op-AGENDADO"]').click();

    // Esperar el selector de fecha para la cita
    const inputFecha = page.locator('[data-testid="input-fecha-agenda"]');
    await expect(inputFecha).toBeVisible({ timeout: 5_000 });

    // Llenar fecha y hora para mostrar el flujo completo
    await inputFecha.fill('2026-05-28');
    const inputHora = page.locator('[data-testid="input-hora-agenda"]');
    if (await inputHora.isVisible()) {
      await inputHora.fill('10:00');
    }

    await page.screenshot({
      path: `${COLAB_DIR}/08-wizard-agendar.png`,
    });
  });

  // ── 09-mi-actividad.png ─────────────────────────────────────────────────────

  test('09-mi-actividad', async ({ page }) => {
    await setupColaborador(page);
    await mockMisEstadisticas(page);
    await mockMiActividad(page);
    await mockMisProspectos(page, { resultados: PROSPECTOS_MANUAL, total: PROSPECTOS_MANUAL.length });
    await mockJornada(page);

    await page.goto('/user/app/dashboard');
    await expect(page.locator('tr.mat-mdc-row, tr.mdc-data-table__row').first()).toBeVisible({
      timeout: 12_000,
    });

    // Cambiar a la pestana "Mi actividad de hoy"
    const tabActividad = page.getByRole('tab', { name: /Mi actividad de hoy/i });
    await expect(tabActividad).toBeVisible({ timeout: 5_000 });
    await tabActividad.click();

    // Esperar el panel de actividad
    const actividadPanel = page.locator('[data-testid="actividad-panel"]');
    await expect(actividadPanel).toBeVisible({ timeout: 8_000 });

    await page.screenshot({
      path: `${COLAB_DIR}/09-mi-actividad.png`,
      fullPage: true,
    });
  });

});

