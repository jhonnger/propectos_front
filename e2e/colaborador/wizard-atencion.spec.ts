import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockMisProspectos,
  mockMisEstadisticas,
  mockMiActividad,
  mockApertura,
  mockCerrarApertura,
  mockHistorial,
  mockVerificacionSbs,
  mockRegistrarAtencion,
  seedSession,
  MOCK_PROSPECTO_NORMAL,
} from '../support/mocks';

/**
 * E2E — Wizard de atención (RF-04/13/14/15), slice 1.3.
 *
 * Todos los casos usan mocks de red; no requieren backend real.
 * Un prospecto en la cola → botón "Gestionar" → wizard se abre.
 */

/** Fixture de prospecto para el wizard (un solo item en la cola). */
const MOCK_WIZARD_PROSPECTO = {
  ...MOCK_PROSPECTO_NORMAL,
  prospectoId: 99,
  asignacionId: 99,
  nombre: 'Laura',
  apellido: 'Mendez',
  celular: '*****901',
  documentoIdentidad: '*****500',
  estado: 'EN_SEGUIMIENTO',
  estadoResultado: null,
};

/**
 * Configura todos los mocks base para el wizard.
 * Registrar DESPUÉS de mockBackend() para que LIFO funcione correctamente.
 */
async function setupWizardMocks(
  page: Page,
  sbsOpts: Parameters<typeof mockVerificacionSbs>[1] = {},
  atencionOpts: Parameters<typeof mockRegistrarAtencion>[1] = {},
): Promise<void> {
  await mockBackend(page, { rol: 'TELEOPERADOR' });
  await mockMisEstadisticas(page);
  await mockMiActividad(page);
  await mockMisProspectos(page, { resultados: [MOCK_WIZARD_PROSPECTO] });
  await mockApertura(page, { aperturaId: 7 });
  await mockCerrarApertura(page);
  await mockHistorial(page);
  await mockVerificacionSbs(page, sbsOpts);
  await mockRegistrarAtencion(page, atencionOpts);
  await seedSession(page, 'TELEOPERADOR');
}

/**
 * Navega al dashboard y abre el wizard para el primer prospecto de la cola.
 */
async function abrirWizard(page: Page): Promise<void> {
  await page.goto('/user/app/dashboard');
  // Esperar que la tabla cargue
  await expect(page.locator('tr.mat-mdc-row, tr.mdc-data-table__row').first()).toBeVisible({ timeout: 10000 });
  // Click en el botón Gestionar del primer prospecto.
  // Usar aria-label exacto para evitar colisión con el chip "Sin gestionar".
  const btnGestionar = page.locator('button[aria-label="Gestionar prospecto"]').first();
  await expect(btnGestionar).toBeEnabled({ timeout: 5000 });
  await btnGestionar.click();
  // Esperar a que el modal se abra
  await expect(page.locator('[data-testid="sbs-section"]')).toBeVisible({ timeout: 8000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Wizard de atención — Slice 1.3 (RF-04/13/14/15)', () => {

  // ── Caso 1: Apertura + historial + SBS bloqueante ─────────────────────────

  test('abrir modal llama apertura, muestra historial y Paso 0 SBS; pasos deshabilitados hasta SBS', async ({ page }) => {
    const aperturaRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/contactos/apertura') && req.method() === 'POST') {
        aperturaRequests.push(req.url());
      }
    });

    await setupWizardMocks(page);
    await abrirWizard(page);

    // Verificar que se llamó a apertura
    await page.waitForTimeout(500);
    expect(aperturaRequests.length).toBeGreaterThan(0);

    // Historial visible con al menos 1 item del mock (la etiqueta renderizada)
    const histItemsHtml = await page.content();
    // El historial muestra la etiqueta "No contestó" (no el código "NO_CONTESTO")
    expect(histItemsHtml).toContain('No contestó');

    // Paso 0 SBS visible con botones APTO y OBSERVADO
    const btnApto = page.locator('[data-testid="btn-sbs-apto"]');
    const btnObservado = page.locator('[data-testid="btn-sbs-observado"]');
    await expect(btnApto).toBeVisible();
    await expect(btnObservado).toBeVisible();

    // Botón de confirmar deshabilitado (SBS no completado)
    const btnConfirmar = page.locator('[data-testid="btn-confirmar"]');
    await expect(btnConfirmar).toBeDisabled();

    // Wizard de llamada bloqueado
    const wizardLlamada = page.locator('[data-testid="wizard-llamada"]');
    await expect(wizardLlamada).toBeVisible();
    // El overlay "Completa SBS" debe estar visible
    const lockOverlay = wizardLlamada.locator('.wizard-locked-overlay');
    await expect(lockOverlay).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/wizard-sbs.png',
      fullPage: false,
    });
  });

  // ── Caso 2: SBS OBSERVADO → modal se cierra sin llamar a /api/contactos ───

  test('SBS OBSERVADO cierra el modal con mensaje de reprogramación; NO llama a /api/contactos', async ({ page }) => {
    const contactosPostRequests: string[] = [];
    page.on('request', (req) => {
      // Capturar solo POST /api/contactos exacto (no apertura ni cierre)
      const url = req.url();
      if (
        req.method() === 'POST' &&
        url.endsWith('/api/contactos') &&
        !url.includes('/apertura') &&
        !url.includes('/verificacion')
      ) {
        contactosPostRequests.push(url);
      }
    });

    await setupWizardMocks(page, { resultado: 'OBSERVADO', fechaReevaluacionSbs: '2026-08-15' });
    await abrirWizard(page);

    // Hacer click en OBSERVADO
    await page.locator('[data-testid="btn-sbs-observado"]').click();

    // Mensaje de reprogramación visible
    const msgObservado = page.locator('[data-testid="sbs-observado-msg"]');
    await expect(msgObservado).toBeVisible({ timeout: 5000 });
    await expect(msgObservado).toContainText('2026-08-15');

    // Modal debe cerrarse automáticamente (~2.5s)
    await expect(page.locator('[data-testid="sbs-section"]')).not.toBeVisible({ timeout: 6000 });

    // No se llamó a registrar atención
    expect(contactosPostRequests.length).toBe(0);
  });

  // ── Caso 3: SBS APTO → rama NO → NO_CONTESTA → confirmar ─────────────────

  test('SBS APTO + rama NO + NO_CONTESTA → POST /api/contactos con resultado NO_CONTESTO y submotivo', async ({ page }) => {
    const capturedBodies: unknown[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        req.method() === 'POST' &&
        url.endsWith('/api/contactos') &&
        !url.includes('/apertura') &&
        !url.includes('/verificacion')
      ) {
        try {
          capturedBodies.push(JSON.parse(req.postData() ?? '{}'));
        } catch { /* ignorar */ }
      }
    });

    await setupWizardMocks(page, { resultado: 'APTO' }, { estado: 'EN_SEGUIMIENTO' });
    await abrirWizard(page);

    // Paso 0: Marcar APTO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="sbs-apto-confirm"]')).toBeVisible();

    // Paso 1: No contestó
    await page.locator('[data-testid="btn-no-contesto"]').click();

    // Paso 2: Seleccionar NO_CONTESTA
    await page.locator('[data-testid="no-contesto-op-NO_CONTESTA"]').click();

    await page.screenshot({
      path: 'test-results/screenshots/wizard-no-contesto.png',
      fullPage: false,
    });

    // Botón confirmar habilitado
    const btnConfirmar = page.locator('[data-testid="btn-confirmar"]');
    await expect(btnConfirmar).toBeEnabled({ timeout: 3000 });

    await btnConfirmar.click();

    // Modal debe cerrarse (éxito)
    await expect(page.locator('[data-testid="sbs-section"]')).not.toBeVisible({ timeout: 6000 });

    // Verificar body enviado
    expect(capturedBodies.length).toBeGreaterThan(0);
    const body = capturedBodies[0] as Record<string, unknown>;
    expect(body['resultado']).toBe('NO_CONTESTO');
    expect(body['submotivoNoContesto']).toBe('NO_CONTESTA');
    expect(body['prospectoId']).toBe(99);
    expect(body['aperturaId']).toBe(7);
  });

  // ── Caso 4: SBS APTO → rama SÍ → titular → AGENDADO sin fecha = no confirmar ──

  test('rama SÍ → titular → AGENDADO sin fecha: confirmar deshabilitado; con fecha futura habilita', async ({ page }) => {
    await setupWizardMocks(page, { resultado: 'APTO' }, { estado: 'AGENDADO' });
    await abrirWizard(page);

    // SBS APTO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: 'test-results/screenshots/wizard-paso1.png',
      fullPage: false,
    });

    // Paso 1: Contestó
    await page.locator('[data-testid="btn-contesto"]').click();

    // Paso 2: Titular
    await page.locator('[data-testid="btn-quien-titular"]').click();

    // Paso 3: AGENDADO
    await page.locator('[data-testid="titular-op-AGENDADO"]').click();

    // Confirmar deshabilitado (sin fecha)
    const btnConfirmar = page.locator('[data-testid="btn-confirmar"]');
    await expect(btnConfirmar).toBeDisabled();

    // Ingresar fecha futura y hora
    const agendaSection = page.locator('[data-testid="agenda-section"]');
    await expect(agendaSection).toBeVisible({ timeout: 3000 });

    await page.locator('[data-testid="input-fecha-agenda"]').fill('2026-12-25');
    await page.locator('[data-testid="input-hora-agenda"]').fill('10:00');

    // Confirmar habilitado
    await expect(btnConfirmar).toBeEnabled({ timeout: 3000 });

    // Confirmar → POST
    const capturedBodies: unknown[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        req.method() === 'POST' &&
        url.endsWith('/api/contactos') &&
        !url.includes('/apertura') &&
        !url.includes('/verificacion')
      ) {
        try { capturedBodies.push(JSON.parse(req.postData() ?? '{}')); } catch { /* */ }
      }
    });

    await btnConfirmar.click();

    // Modal cierra
    await expect(page.locator('[data-testid="sbs-section"]')).not.toBeVisible({ timeout: 6000 });

    // Body contiene AGENDADO + fechaAgenda
    expect(capturedBodies.length).toBeGreaterThan(0);
    const body = capturedBodies[0] as Record<string, unknown>;
    expect(body['resultado']).toBe('AGENDADO');
    expect(body['quienContesto']).toBe('TITULAR');
    expect(typeof body['fechaAgenda']).toBe('string');
  });

  // ── Caso 5: Backend 400 en registrar → muestra el message real, modal sigue abierto ──

  test('backend 400 en registrar atención muestra el mensaje real y mantiene el modal abierto', async ({ page }) => {
    await setupWizardMocks(
      page,
      { resultado: 'APTO' },
      { fail: true, failMessage: 'submotivo obligatorio para resultado NO_CONTESTO' },
    );
    await abrirWizard(page);

    // SBS APTO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 5000 });

    // Rama NO → opción BUZON
    await page.locator('[data-testid="btn-no-contesto"]').click();
    await page.locator('[data-testid="no-contesto-op-BUZON"]').click();

    // Confirmar
    const btnConfirmar = page.locator('[data-testid="btn-confirmar"]');
    await expect(btnConfirmar).toBeEnabled({ timeout: 3000 });
    await btnConfirmar.click();

    // Error visible con el mensaje del backend
    const errorBanner = page.locator('[data-testid="error-envio"]');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
    await expect(errorBanner).toContainText('submotivo obligatorio para resultado NO_CONTESTO');

    // Modal sigue abierto
    await expect(page.locator('[data-testid="sbs-section"]')).toBeVisible();
  });

  // ── Caso 6: Backend 400 "fecha agenda debe ser futura" → mensaje visible, wizard abierto ──

  test('backend 400 fecha-agenda-debe-ser-futura: muestra el mensaje exacto del backend y mantiene el wizard abierto con el formulario editable', async ({ page }) => {
    const MSG_FUTURA = 'La fecha de agenda debe ser futura (posterior a la fecha y hora actual).';

    await setupWizardMocks(
      page,
      { resultado: 'APTO' },
      { fail: true, failMessage: MSG_FUTURA },
    );
    await abrirWizard(page);

    // SBS APTO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 5000 });

    // Rama SÍ → titular → AGENDADO
    await page.locator('[data-testid="btn-contesto"]').click();
    await page.locator('[data-testid="btn-quien-titular"]').click();
    await page.locator('[data-testid="titular-op-AGENDADO"]').click();

    // Ingresar fecha futura y hora (el mock rechazará igualmente)
    const inputFecha = page.locator('[data-testid="input-fecha-agenda"]');
    const inputHora = page.locator('[data-testid="input-hora-agenda"]');
    await expect(inputFecha).toBeVisible({ timeout: 3000 });
    await inputFecha.fill('2026-12-25');
    await inputHora.fill('14:00');

    // Confirmar habilitado → click
    const btnConfirmar = page.locator('[data-testid="btn-confirmar"]');
    await expect(btnConfirmar).toBeEnabled({ timeout: 3000 });
    await btnConfirmar.click();

    // El error-banner muestra el mensaje EXACTO del backend
    const errorBanner = page.locator('[data-testid="error-envio"]');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
    await expect(errorBanner).toContainText(MSG_FUTURA);

    // El wizard permanece abierto (SBS section visible)
    await expect(page.locator('[data-testid="sbs-section"]')).toBeVisible();

    // El formulario sigue editable (la fecha se puede modificar)
    await expect(inputFecha).toBeVisible();
    await expect(inputFecha).toBeEnabled();

    // El botón confirmar se re-habilita (enviando=false) y el form no se pierde
    await expect(btnConfirmar).toBeEnabled({ timeout: 3000 });

    await page.screenshot({
      path: 'test-results/screenshots/wizard-agenda-400-futura.png',
      fullPage: false,
    });
  });

  // ── Caso 7: Seleccionar domingo deshabilita el botón confirmar ───────────────

  test('seleccionar un domingo en la fecha de agenda deshabilita el botón confirmar y muestra aviso', async ({ page }) => {
    await setupWizardMocks(page, { resultado: 'APTO' }, { estado: 'AGENDADO' });
    await abrirWizard(page);

    // SBS APTO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 5000 });

    // Rama SÍ → titular → AGENDADO
    await page.locator('[data-testid="btn-contesto"]').click();
    await page.locator('[data-testid="btn-quien-titular"]').click();
    await page.locator('[data-testid="titular-op-AGENDADO"]').click();

    const inputFecha = page.locator('[data-testid="input-fecha-agenda"]');
    const inputHora = page.locator('[data-testid="input-hora-agenda"]');
    await expect(inputFecha).toBeVisible({ timeout: 3000 });

    // 2026-12-27 es domingo (verificado: getDay()===0)
    await inputFecha.fill('2026-12-27');
    await inputHora.fill('10:00');

    // El aviso de domingo debe aparecer
    const errDomingo = page.locator('[data-testid="error-fecha-domingo"]');
    await expect(errDomingo).toBeVisible({ timeout: 3000 });
    await expect(errDomingo).toContainText('domingo');

    // El botón confirmar debe estar deshabilitado (domingo no laborable)
    const btnConfirmar = page.locator('[data-testid="btn-confirmar"]');
    await expect(btnConfirmar).toBeDisabled();

    await page.screenshot({
      path: 'test-results/screenshots/wizard-agenda-domingo.png',
      fullPage: false,
    });
  });

  // ── Caso 8: Campo fecha con min=hoy — el picker no ofrece fechas pasadas ────

  test('el campo fecha-agenda tiene el atributo min=hoy para evitar selección de fechas pasadas', async ({ page }) => {
    await setupWizardMocks(page, { resultado: 'APTO' }, { estado: 'AGENDADO' });
    await abrirWizard(page);

    // SBS APTO → rama SÍ → titular → AGENDADO
    await page.locator('[data-testid="btn-sbs-apto"]').click();
    await expect(page.locator('[data-testid="sbs-apto-badge"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="btn-contesto"]').click();
    await page.locator('[data-testid="btn-quien-titular"]').click();
    await page.locator('[data-testid="titular-op-AGENDADO"]').click();

    const inputFecha = page.locator('[data-testid="input-fecha-agenda"]');
    await expect(inputFecha).toBeVisible({ timeout: 3000 });

    // Verificar que el atributo min está presente y apunta a hoy o antes de hoy
    const minValue = await inputFecha.getAttribute('min');
    expect(minValue).toBeTruthy();
    // El min debe ser una fecha en formato YYYY-MM-DD (hoy)
    expect(minValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Intentar ingresar una fecha pasada → confirmar debe permanecer deshabilitado
    // (el browser enforcement del min puede variar; probamos con la lógica de validación)
    const inputHora = page.locator('[data-testid="input-hora-agenda"]');
    await inputFecha.fill('2020-01-01');
    await inputHora.fill('09:00');

    const btnConfirmar = page.locator('[data-testid="btn-confirmar"]');
    await expect(btnConfirmar).toBeDisabled();

    // El mensaje de fecha pasada debe aparecer
    const errPasada = page.locator('[data-testid="error-fecha-pasada"]');
    await expect(errPasada).toBeVisible({ timeout: 3000 });
    await expect(errPasada).toContainText('futuras');
  });

  // ── Caso 9: Cerrar modal sin registrar llama a cerrar-apertura ──────────────

  test('cerrar modal sin registrar llama a /api/contactos/apertura/{id}/cerrar', async ({ page }) => {
    const cerrarRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/contactos/apertura/') && req.url().includes('/cerrar')) {
        cerrarRequests.push(req.url());
      }
    });

    await setupWizardMocks(page, { resultado: 'APTO' });
    await abrirWizard(page);

    // Cerrar el modal usando el botón de cierre (X)
    const closeBtn = page.locator('.close-btn').first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Modal debe cerrarse
    await expect(page.locator('[data-testid="sbs-section"]')).not.toBeVisible({ timeout: 5000 });

    // Se debe haber llamado a cerrar-apertura (best-effort, puede demorar)
    await page.waitForTimeout(500);
    expect(cerrarRequests.length).toBeGreaterThan(0);
    expect(cerrarRequests[0]).toContain('/api/contactos/apertura/7/cerrar');
  });

});
