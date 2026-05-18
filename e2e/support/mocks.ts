import { Page } from '@playwright/test';

/**
 * Helpers de mock de API para E2E deterministas (sin backend).
 *
 * Si la variable de entorno E2E_BASE_API está definida, los mocks se DESACTIVAN
 * y los specs corren contra el backend real (modo integración).
 */

export const REAL_BACKEND = !!process.env.E2E_BASE_API;

export const TOKEN_FAKE =
  'eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJlMmUiLCJpYXQiOjE3MDAwMDAwMDB9.fake-e2e-signature';

interface LoginMockOptions {
  /** Rol que devuelve el backend para credenciales válidas. */
  rol?: 'ADMINISTRADOR' | 'TELEOPERADOR';
  /** Si true, /api/auth/login responde 401 (credenciales inválidas). */
  fail?: boolean;
}

/**
 * Intercepta POST **\/api/auth/login.
 * - fail=false → 200 { token, rol, nombre }
 * - fail=true  → 401
 * Además intercepta cualquier otra llamada **\/api/** con 200 vacío para que
 * las pantallas posteriores (dashboard) no exploten por el backend ausente.
 */
export async function mockBackend(page: Page, opts: LoginMockOptions = {}): Promise<void> {
  if (REAL_BACKEND) return; // modo backend real: no se mockea nada

  const rol = opts.rol ?? 'ADMINISTRADOR';

  await page.route('**/api/auth/login', async (route) => {
    if (opts.fail) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Credenciales incorrectas' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: TOKEN_FAKE,
        rol,
        nombre: rol === 'ADMINISTRADOR' ? 'Administrador Sistema' : 'Colaborador E2E',
      }),
    });
  });

  // Catch-all para el resto de endpoints: respuesta vacía 200 (evita ruido).
  // Playwright evalúa los handlers en orden inverso de registro, así que este
  // se evalúa ANTES que el de login: para esa URL hay que delegar con
  // route.fallback() (un simple `return` dejaría la request colgada).
  await page.route('**/api/**', async (route) => {
    if (route.request().url().includes('/api/auth/login')) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
}

/** Siembra una sesión válida en localStorage (token + rol + nombre). */
export async function seedSession(
  page: Page,
  rol: 'ADMINISTRADOR' | 'TELEOPERADOR' = 'ADMINISTRADOR',
): Promise<void> {
  await page.addInitScript(
    ([token, role]) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', 'Sesion E2E');
    },
    [TOKEN_FAKE, rol] as const,
  );
}

// ── RF-17: Cola colaborador helpers ─────────────────────────────────────────

export interface MisProspectosItem {
  asignacionId: number;
  prospectoId: number;
  nombre: string;
  apellido: string;
  celular: string;
  celularMasked: boolean;
  documentoIdentidad: string;
  campania: string;
  estado: string;
  estadoResultado: string | null;
  fechaAgenda: string | null;
  verificacionSbs: string | null;
  fechaReevaluacionSbs: string | null;
  proximaLlamada: string | null;
  intentosFallidos: number;
  ultimoContacto: string | null;
  totalContactos: number;
  nroPrestamosConcretados: number;
  vencido: boolean;
  futuro: boolean;
}

export interface MisProspectosResponse {
  filtro: string;
  pagina: number;
  tamanioPagina: number;
  total: number;
  totalPaginas: number;
  resultados: MisProspectosItem[];
}

export interface MisProspectosMockOptions {
  fail?: boolean;
  failMessage?: string;
  resultados?: MisProspectosItem[];
  total?: number;
}

/** Fixture de prospecto vencido para tests. */
export const MOCK_PROSPECTO_VENCIDO: MisProspectosItem = {
  asignacionId: 1,
  prospectoId: 1,
  nombre: 'Juan Pablo',
  apellido: 'Pérez Gómez',
  celular: '******222',
  celularMasked: true,
  documentoIdentidad: '*****678',
  campania: 'CampañaA',
  estado: 'EN_SEGUIMIENTO',
  estadoResultado: 'NO_CONTESTO',
  fechaAgenda: null,
  verificacionSbs: null,
  fechaReevaluacionSbs: null,
  proximaLlamada: null,
  intentosFallidos: 2,
  ultimoContacto: null,
  totalContactos: 0,
  nroPrestamosConcretados: 0,
  vencido: true,
  futuro: false,
};

/** Fixture de cliente recurrente para tests. */
export const MOCK_PROSPECTO_RECURRENTE: MisProspectosItem = {
  asignacionId: 2,
  prospectoId: 2,
  nombre: 'María',
  apellido: 'López Silva',
  celular: '***321',
  celularMasked: true,
  documentoIdentidad: '*****999',
  campania: 'CampañaB',
  estado: 'EN_SEGUIMIENTO',
  estadoResultado: 'AGENDADO',
  fechaAgenda: '2026-05-17T10:30:00',
  verificacionSbs: null,
  fechaReevaluacionSbs: null,
  proximaLlamada: null,
  intentosFallidos: 0,
  ultimoContacto: null,
  totalContactos: 3,
  nroPrestamosConcretados: 2,
  vencido: false,
  futuro: false,
};

/** Fixture normal sin características especiales. */
export const MOCK_PROSPECTO_NORMAL: MisProspectosItem = {
  asignacionId: 3,
  prospectoId: 3,
  nombre: 'Carlos',
  apellido: 'Quispe',
  celular: '*****321',
  celularMasked: true,
  documentoIdentidad: '*****111',
  campania: 'CampañaC',
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
};

/**
 * Mockea GET /api/asignaciones/mis-prospectos.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockMisProspectos(
  page: Page,
  opts: MisProspectosMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/asignaciones/mis-prospectos**', async (route) => {
    if (opts.fail) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: opts.failMessage ?? 'Filtro inválido.',
        }),
      });
      return;
    }

    const resultados = opts.resultados ?? [
      MOCK_PROSPECTO_VENCIDO,
      MOCK_PROSPECTO_RECURRENTE,
      MOCK_PROSPECTO_NORMAL,
    ];

    const url = new URL(route.request().url());
    const filtro = url.searchParams.get('filtro') ?? 'MI_COLA_HOY';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        filtro,
        pagina: 1,
        tamanioPagina: 10,
        total: opts.total ?? resultados.length,
        totalPaginas: 1,
        resultados,
      } satisfies MisProspectosResponse),
    });
  });
}

/**
 * Mockea GET /api/asignaciones/mi-actividad.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockMiActividad(page: Page): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/asignaciones/mi-actividad**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        generadoEn: new Date().toISOString(),
        totalGestiones: 5,
        resumenPorResultado: {
          NO_CONTESTO: 3,
          AGENDADO: 1,
          PROSPECTO: 1,
        },
        gestiones: [
          {
            contactoId: 12,
            asignacionId: 7,
            prospectoId: 3,
            nombreProspecto: 'Juan Quispe',
            celular: '*****321',
            fechaContacto: new Date().toISOString(),
            estadoResultado: 'NO_CONTESTO',
            comentario: 'No atendió el teléfono.',
            duracionGestion: 45,
          },
          {
            contactoId: 13,
            asignacionId: 8,
            prospectoId: 4,
            nombreProspecto: 'Ana Torres',
            celular: '***456',
            fechaContacto: new Date().toISOString(),
            estadoResultado: 'AGENDADO',
            comentario: 'Agendada para mañana.',
            duracionGestion: 120,
          },
        ],
      }),
    });
  });
}

/**
 * Mockea GET /api/asignaciones/mis-estadisticas.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockMisEstadisticas(page: Page): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/asignaciones/mis-estadisticas**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sinGestionar: 5,
        enGestion: 3,
        enSeguimiento: 4,
        derivados: 1,
        ganados: 2,
        descartados: 0,
      }),
    });
  });
}

// ── RF-19: Import helpers ────────────────────────────────────────────────────

export interface ImportMockOptions {
  /** Si true, simula HTTP 400 con el mensaje dado. */
  fail?: boolean;
  failMessage?: string;
  /** Resultados de la importación exitosa. */
  importados?: number;
  rechazados?: number;
  detalleRechazos?: Array<{ fila: number; motivo: string }>;
  cargaMasivaId?: number;
}

/**
 * Mockea POST /api/prospectos/importar.
 * Debe llamarse DESPUÉS de mockBackend() para que no sea absorbido por el catch-all
 * (Playwright evalúa en orden LIFO; el handler más específico aquí reemplaza al catch-all
 * para esta URL concreta porque se registra DESPUÉS).
 */
export async function mockImportarExcel(page: Page, opts: ImportMockOptions = {}): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/prospectos/importar', async (route) => {
    if (opts.fail) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          status: 400,
          error: 'Bad Request',
          message: opts.failMessage ?? 'El archivo esta vacio o no contiene filas validas.',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        mensaje: 'Importacion completada.',
        cargaMasivaId: opts.cargaMasivaId ?? 1,
        importados: opts.importados ?? 3,
        rechazados: opts.rechazados ?? 1,
        detalleRechazos: opts.detalleRechazos ?? [
          { fila: 5, motivo: 'Campos obligatorios faltantes: celular' },
        ],
      }),
    });
  });
}

// ── RF-19: Asignacion multi helpers ─────────────────────────────────────────

export interface CargaMasivaMockOptions {
  id?: number;
  nombrearchivo?: string;
  prospectosSinAsignar?: number;
  cantidadProspectos?: number;
}

export interface AsignarMultiMockOptions {
  fail?: boolean;
  failMessage?: string;
  totalAsignados?: number;
  saldoSinAsignar?: number;
  detalle?: Array<{ usuarioId: number; usuarioNombre: string; asignados: number }>;
  cargaMasivaId?: number;
}

/** Fixtures de usuarios no-admin usados en los specs de asignacion multi. */
export const MOCK_USUARIOS = [
  {
    id: 2,
    nombre: 'Cola',
    apellidos: 'Uno',
    usuario: 'cuno',
    email: 'cuno@test.com',
    estado: true,
    nombreCompleto: 'Cola Uno',
    rolId: 2,
    rolNombre: 'TELEOPERADOR',
  },
  {
    id: 3,
    nombre: 'Beta',
    apellidos: 'Dos',
    usuario: 'bdos',
    email: 'bdos@test.com',
    estado: true,
    nombreCompleto: 'Beta Dos',
    rolId: 2,
    rolNombre: 'TELEOPERADOR',
  },
];

/**
 * Configura todos los mocks necesarios para la pantalla de asignacion multi.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockAsignacionMulti(
  page: Page,
  cargaOpts: CargaMasivaMockOptions = {},
  asignarOpts: AsignarMultiMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  const cargaId = cargaOpts.id ?? 1;
  const disponibles = cargaOpts.prospectosSinAsignar ?? 4;

  // GET /api/cargas-masivas
  await page.route('**/api/cargas-masivas**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: cargaId,
          nombrearchivo: cargaOpts.nombrearchivo ?? 'test.xlsx',
          fecha: new Date().toISOString(),
          cantidadProspectos: cargaOpts.cantidadProspectos ?? 10,
          estadoAsignacion: 'SIN_ASIGNAR',
          fechaAsignacion: null,
          usuarioAsignadoId: null,
          usuarioAsignadoNombre: null,
          usuarioAsignadoApellidos: null,
          usuarioAsignadoCompleto: null,
          prospectosAsignados: 0,
          prospectosSinAsignar: disponibles,
          resumenAsignaciones: [],
        },
      ]),
    });
  });

  // GET /api/usuarios/no-admins
  await page.route('**/api/usuarios/no-admins**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USUARIOS),
    });
  });

  // POST /api/asignaciones/asignar-multi
  await page.route('**/api/asignaciones/asignar-multi**', async (route) => {
    if (asignarOpts.fail) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: asignarOpts.failMessage ?? 'La suma solicitada excede los prospectos disponibles.',
        }),
      });
      return;
    }

    const totalAsignados = asignarOpts.totalAsignados ?? 3;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        mensaje: 'Reparto completado exitosamente',
        cargaMasivaId: cargaId,
        cargaMasivaNombre: cargaOpts.nombrearchivo ?? 'test.xlsx',
        disponiblesAntes: disponibles,
        totalAsignados,
        saldoSinAsignar: asignarOpts.saldoSinAsignar ?? disponibles - totalAsignados,
        detalle: asignarOpts.detalle ?? [
          { usuarioId: 2, usuarioNombre: 'Cola Uno', asignados: 2 },
          { usuarioId: 3, usuarioNombre: 'Beta Dos', asignados: 1 },
        ],
        fechaAsignacion: new Date().toISOString(),
      }),
    });
  });
}

// ── RF-04/13/14/15: Wizard de atención helpers ───────────────────────────────

export interface AperturaMockOptions {
  fail?: boolean;
  aperturaId?: number;
}

export interface HistorialMockOptions {
  items?: Array<{
    fechaContacto: string;
    resultado: string;
    submotivoNoContesto: string | null;
    quienContesto: string | null;
    verificacionSbs: string | null;
    comentario: string | null;
    duracionGestion: number | null;
  }>;
}

export interface VerificacionSbsMockOptions {
  resultado?: 'APTO' | 'OBSERVADO';
  fail?: boolean;
  failMessage?: string;
  fechaReevaluacionSbs?: string;
}

export interface RegistrarAtencionMockOptions {
  fail?: boolean;
  failMessage?: string;
  estado?: string;
}

/**
 * Mockea POST /api/contactos/apertura (path exacto, no subpaths).
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockApertura(
  page: Page,
  opts: AperturaMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route(
    (url) => new URL(url).pathname.endsWith('/api/contactos/apertura'),
    async (route) => {
      if (route.request().method() !== 'POST') { await route.fallback(); return; }
      if (opts.fail) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Error interno"}' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          aperturaId: opts.aperturaId ?? 7,
          inicio: new Date().toISOString(),
        }),
      });
    },
  );
}

/**
 * Mockea POST /api/contactos/apertura/{id}/cerrar.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockCerrarApertura(page: Page): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/contactos/apertura/*/cerrar', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

/**
 * Mockea GET /api/contactos/historial/{prospectoId}.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockHistorial(
  page: Page,
  opts: HistorialMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/contactos/historial/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        opts.items ?? [
          {
            fechaContacto: '2026-05-10T10:30:00',
            resultado: 'NO_CONTESTO',
            submotivoNoContesto: 'NO_CONTESTA',
            quienContesto: null,
            verificacionSbs: null,
            comentario: 'No atendió el teléfono.',
            duracionGestion: 45,
          },
        ],
      ),
    });
  });
}

/**
 * Mockea POST /api/contactos/verificacion-sbs.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockVerificacionSbs(
  page: Page,
  opts: VerificacionSbsMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/contactos/verificacion-sbs', async (route) => {
    if (opts.fail) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: opts.failMessage ?? 'Error de verificación SBS.' }),
      });
      return;
    }

    const resultado = opts.resultado ?? 'APTO';
    if (resultado === 'APTO') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ continuar: true }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          continuar: false,
          estado: 'EN_SEGUIMIENTO',
          fechaReevaluacionSbs: opts.fechaReevaluacionSbs ?? '2026-08-15',
        }),
      });
    }
  });
}

// ── Slice 1.4: Por cerrar helpers ────────────────────────────────────────────

export interface PorCerrarMockItem {
  asignacionId: number;
  prospectoId: number;
  nombre: string;
  apellido: string;
  celular: string;
  celularMasked: boolean;
  documentoIdentidad: string;
  campania: string;
  derivadoPorId: number;
  derivadoPorNombre: string;
  fechaDerivacion: string;
  nroPrestamosConcretados: number;
}

export interface PorCerrarMockOptions {
  resultados?: PorCerrarMockItem[];
  total?: number;
}

export interface RegistrarVentaMockOptions {
  fail?: boolean;
  failMessage?: string;
  estado?: string;
  nroPrestamosConcretados?: number;
}

export interface NoCerroMockOptions {
  fail?: boolean;
  failMessage?: string;
  estado?: string;
}

/** Fixtures de casos por cerrar para los tests E2E. */
export const MOCK_POR_CERRAR_NORMAL: PorCerrarMockItem = {
  asignacionId: 10,
  prospectoId: 10,
  nombre: 'Der1',
  apellido: 'Apellido',
  celular: '******000',
  celularMasked: true,
  documentoIdentidad: '*****001',
  campania: 'CampZ',
  derivadoPorId: 2,
  derivadoPorNombre: 'Col Uno',
  fechaDerivacion: '2026-05-17T10:00:00',
  nroPrestamosConcretados: 0,
};

export const MOCK_POR_CERRAR_RECURRENTE: PorCerrarMockItem = {
  asignacionId: 11,
  prospectoId: 11,
  nombre: 'RecurrenteNom',
  apellido: 'RecurrenteAp',
  celular: '******111',
  celularMasked: true,
  documentoIdentidad: '*****002',
  campania: 'CampA',
  derivadoPorId: 3,
  derivadoPorNombre: 'Col Dos',
  fechaDerivacion: '2026-05-16T14:30:00',
  nroPrestamosConcretados: 2,
};

/**
 * Mockea GET /api/cierre/por-cerrar.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockPorCerrar(
  page: Page,
  opts: PorCerrarMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  const resultados = opts.resultados ?? [MOCK_POR_CERRAR_NORMAL, MOCK_POR_CERRAR_RECURRENTE];

  await page.route('**/api/cierre/por-cerrar**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        resultados,
        pagina: 1,
        tamanioPagina: 10,
        total: opts.total ?? resultados.length,
        totalPaginas: 1,
      }),
    });
  });
}

/**
 * Mockea POST /api/cierre/{asignacionId}/venta.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockRegistrarVenta(
  page: Page,
  opts: RegistrarVentaMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/cierre/*/venta', async (route) => {
    if (route.request().method() !== 'POST') { await route.fallback(); return; }

    if (opts.fail) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: opts.failMessage ?? 'Error al registrar venta.' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        estado: opts.estado ?? 'GANADO',
        prospectoId: 10,
        derivadoPorId: 2,
        fechaElegibilidad: '2026-12-01',
        nroPrestamosConcretados: opts.nroPrestamosConcretados ?? 1,
      }),
    });
  });
}

/**
 * Mockea POST /api/cierre/{asignacionId}/no-cerro.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockNoCerro(
  page: Page,
  opts: NoCerroMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/cierre/*/no-cerro', async (route) => {
    if (route.request().method() !== 'POST') { await route.fallback(); return; }

    if (opts.fail) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: opts.failMessage ?? 'Error en la operacion.' }),
      });
      return;
    }

    const body = JSON.parse(route.request().postData() ?? '{}') as { accion?: string };
    const estado = opts.estado ?? (body.accion === 'DESCARTAR' ? 'DESCARTADO' : 'EN_SEGUIMIENTO');

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, estado }),
    });
  });
}

// ── Slice 1.5: Dashboard del dueño helpers ───────────────────────────────────

export interface DashboardMockOptions {
  fail?: boolean;
  failStatus?: number;
  failMessage?: string;
  porCerrar?: number;
  dia?: Partial<{
    ventasCerradas: number;
    derivados: number;
    atenciones: number;
    contactabilidadReal: number;
    colaboradoresActivos: number;
    colaboradoresTotal: number;
    citasHoy: number;
  }>;
  mes?: Partial<{
    ventasCerradas: number;
    derivados: number;
    atenciones: number;
    tasaConversion: number;
    avanceBasesPct: number;
    disponiblesSinAsignar: number;
  }>;
}

export interface ColaboradorDrilldownMockOptions {
  fail?: boolean;
  failStatus?: number;
  failMessage?: string;
  resultados?: Array<{
    asignacionId: number;
    prospectoId: number;
    nombreProspecto: string;
    celular: string;
    documentoIdentidad: string;
    campania: string;
    estado: string;
    estadoResultado: string | null;
    fechaAgenda: string | null;
    fechaAsignacion: string | null;
    fechaCierre: string | null;
    totalContactos: number;
  }>;
  total?: number;
}

export const MOCK_DASHBOARD_DATA = {
  dia: {
    ventasCerradas: 3,
    derivados: 7,
    atenciones: 42,
    contactabilidadReal: 0.68,
    colaboradoresActivos: 4,
    colaboradoresTotal: 5,
    citasHoy: 6,
  },
  mes: {
    ventasCerradas: 21,
    derivados: 48,
    atenciones: 310,
    tasaConversion: 0.44,
    avanceBasesPct: 0.61,
    disponiblesSinAsignar: 120,
  },
  ranking: [
    {
      usuarioId: 2,
      nombre: 'Cola Uno',
      ventasCerradas: 8,
      derivados: 15,
      atenciones: 102,
      contactabilidad: 0.72,
      ultimaActividad: '2026-05-17T09:45:00',
    },
    {
      usuarioId: 3,
      nombre: 'Beta Dos',
      ventasCerradas: 5,
      derivados: 9,
      atenciones: 88,
      contactabilidad: 0.58,
      ultimaActividad: '2026-05-17T08:30:00',
    },
  ],
  embudo: {
    asignados: 500,
    gestionados: 380,
    contactadosTitular: 210,
    interesados: 90,
    derivados: 48,
    ventas: 21,
  },
  porCerrar: 7,
  bases: [
    {
      id: 1,
      nombre: 'base_mayo.xlsx',
      cantidad: 300,
      asignados: 250,
      sinAsignar: 50,
      avancePct: 0.83,
    },
    {
      id: 2,
      nombre: 'base_abril.xlsx',
      cantidad: 200,
      asignados: 200,
      sinAsignar: 0,
      avancePct: 1.0,
    },
  ],
};

export const MOCK_DRILLDOWN_RESULTADOS = [
  {
    asignacionId: 100,
    prospectoId: 200,
    nombreProspecto: 'Juan Pérez',
    celular: '******222',
    documentoIdentidad: '*****678',
    campania: 'CampañaA',
    estado: 'EN_GESTION',
    estadoResultado: 'AGENDADO',
    fechaAgenda: '2026-05-20T10:00:00',
    fechaAsignacion: '2026-05-01T08:00:00',
    fechaCierre: null,
    totalContactos: 3,
  },
  {
    asignacionId: 101,
    prospectoId: 201,
    nombreProspecto: 'María López',
    celular: '***321',
    documentoIdentidad: '*****999',
    campania: 'CampañaB',
    estado: 'FINALIZADO',
    estadoResultado: 'CONCRETO_PRESTAMO',
    fechaAgenda: null,
    fechaAsignacion: '2026-05-02T09:00:00',
    fechaCierre: '2026-05-15T11:00:00',
    totalContactos: 5,
  },
];

/**
 * Mockea GET /api/reportes/dashboard.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockDashboardAdmin(
  page: Page,
  opts: DashboardMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/reportes/dashboard', async (route) => {
    if (opts.fail) {
      await route.fulfill({
        status: opts.failStatus ?? 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: opts.failMessage ?? 'Error interno del servidor.' }),
      });
      return;
    }

    const body = {
      dia: { ...MOCK_DASHBOARD_DATA.dia, ...(opts.dia ?? {}) },
      mes: { ...MOCK_DASHBOARD_DATA.mes, ...(opts.mes ?? {}) },
      ranking: MOCK_DASHBOARD_DATA.ranking,
      embudo: MOCK_DASHBOARD_DATA.embudo,
      porCerrar: opts.porCerrar ?? MOCK_DASHBOARD_DATA.porCerrar,
      bases: MOCK_DASHBOARD_DATA.bases,
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/**
 * Mockea GET /api/reportes/colaborador/{usuarioId}.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockColaboradorDrilldown(
  page: Page,
  opts: ColaboradorDrilldownMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/reportes/colaborador/**', async (route) => {
    if (opts.fail) {
      await route.fulfill({
        status: opts.failStatus ?? 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: opts.failMessage ?? 'Error al cargar colaborador.' }),
      });
      return;
    }

    const resultados = opts.resultados ?? MOCK_DRILLDOWN_RESULTADOS;
    const url = new URL(route.request().url());
    const pagina = parseInt(url.searchParams.get('pagina') ?? '1', 10);
    const tamanioPagina = parseInt(url.searchParams.get('tamanioPagina') ?? '10', 10);
    const total = opts.total ?? resultados.length;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        colaborador: { id: 2, nombre: 'Cola Uno' },
        resultados,
        pagina,
        tamanioPagina,
        total,
        totalPaginas: Math.ceil(total / tamanioPagina),
      }),
    });
  });
}

/**
 * Mockea GET /api/reportes/exportar-prospectos devolviendo un Blob xlsx falso.
 * Debe llamarse DESPUÉS de mockBackend().
 */
export async function mockExportarProspectos(page: Page): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route('**/api/reportes/exportar-prospectos', async (route) => {
    // Simular un blob binario mínimo
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: Buffer.from('PK mock xlsx'),
    });
  });
}

/**
 * Mockea POST /api/contactos (registrar atención — path exacto, sin subpaths).
 * Debe llamarse DESPUÉS de mockBackend().
 *
 * IMPORTANTE: usa una función de predicado para que SOLO coincida con el path
 * exacto /api/contactos (evita colisionar con /api/contactos/apertura, etc.).
 */
export async function mockRegistrarAtencion(
  page: Page,
  opts: RegistrarAtencionMockOptions = {},
): Promise<void> {
  if (REAL_BACKEND) return;

  await page.route(
    (url) => {
      const path = new URL(url).pathname;
      return path.endsWith('/api/contactos');
    },
    async (route) => {
      if (route.request().method() !== 'POST') { await route.fallback(); return; }

      if (opts.fail) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: opts.failMessage ?? 'Error al registrar atención.' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          estado: opts.estado ?? 'EN_SEGUIMIENTO',
          proximaLlamada: null,
        }),
      });
    },
  );
}
