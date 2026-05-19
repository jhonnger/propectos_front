import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockConfiguracion,
  mockEstadoEmail,
  seedSession,
  MOCK_CONFIGURACION_DEFAULT,
} from '../support/mocks';
import * as fs from 'fs';

/**
 * E2E — Pantalla de configuración del dueño (Slice 2.1, RF-08).
 *
 * Solo rol ADMINISTRADOR. Todos los casos usan mocks de red.
 */

const SCREENSHOTS_DIR = 'test-results/screenshots';

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'ADMINISTRADOR' });
  await seedSession(page, 'ADMINISTRADOR');
}

async function irAConfiguracion(page: Page): Promise<void> {
  await page.goto('/admin/configuracion');
  await expect(page.locator('[data-testid="config-content"]')).toBeVisible({ timeout: 10_000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Configuracion del dueno — Slice 2.1', () => {

  // ── Caso 1: Carga la config — valores reflejados en el formulario ───────────

  test('carga la configuracion y los campos reflejan los valores del mock', async ({ page }) => {
    await setup(page);
    await mockEstadoEmail(page, { mailConfigurado: true, ok: false, fecha: null });
    await mockConfiguracion(page, { config: MOCK_CONFIGURACION_DEFAULT });

    await irAConfiguracion(page);

    // Toggles — todos off según el mock
    // mat-slide-toggle en Angular Material 17+ renderiza como role="switch"
    const toggleInstantaneo = page.locator('[data-testid="toggle-email-instantaneo"] [role="switch"]');
    const toggleDigest = page.locator('[data-testid="toggle-email-digest"] [role="switch"]');
    const toggleResumen = page.locator('[data-testid="toggle-resumen-diario"] [role="switch"]');

    await expect(toggleInstantaneo).toHaveAttribute('aria-checked', 'false');
    await expect(toggleDigest).toHaveAttribute('aria-checked', 'false');
    await expect(toggleResumen).toHaveAttribute('aria-checked', 'false');

    // Metas
    await expect(page.locator('[data-testid="input-meta-ventas"]')).toHaveValue(
      String(MOCK_CONFIGURACION_DEFAULT.metaVentasMensual),
    );
    await expect(page.locator('[data-testid="input-meta-derivados"]')).toHaveValue(
      String(MOCK_CONFIGURACION_DEFAULT.metaDerivadosPorColaborador),
    );

    // Parámetros operativos
    await expect(page.locator('[data-testid="input-plazo-sbs"]')).toHaveValue(
      String(MOCK_CONFIGURACION_DEFAULT.plazoReevaluacionSbsDias),
    );
    await expect(page.locator('[data-testid="input-max-intentos"]')).toHaveValue(
      String(MOCK_CONFIGURACION_DEFAULT.maxIntentosNoContesto),
    );
    await expect(page.locator('[data-testid="input-regla-reintento"]')).toHaveValue(
      MOCK_CONFIGURACION_DEFAULT.reglaReintentoNoContesto,
    );
    await expect(page.locator('[data-testid="input-hora-inicio"]')).toHaveValue(
      MOCK_CONFIGURACION_DEFAULT.horaInicioJornada,
    );
    await expect(page.locator('[data-testid="input-minutos-gracia"]')).toHaveValue(
      String(MOCK_CONFIGURACION_DEFAULT.minutosGraciaAusencia),
    );

    // Asegurarse que el directorio de screenshots existe
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/configuracion.png`,
      fullPage: true,
    });
  });

  // ── Caso 2: Cambiar toggles + metas + parámetro → PUT + snackbar ───────────

  test('cambiar toggles metas y parametros y Guardar hace PUT con patch y muestra snackbar', async ({ page }) => {
    const capturedBodies: Array<Record<string, unknown>> = [];
    page.on('request', (req) => {
      if (
        req.url().includes('/api/reportes/config') &&
        req.method() === 'PUT'
      ) {
        try { capturedBodies.push(JSON.parse(req.postData() ?? '{}')); } catch { /* */ }
      }
    });

    await setup(page);
    await mockEstadoEmail(page, { mailConfigurado: true });
    await mockConfiguracion(page, { config: MOCK_CONFIGURACION_DEFAULT });

    await irAConfiguracion(page);

    // Activar toggle de email instantáneo
    await page.locator('[data-testid="toggle-email-instantaneo"]').click();

    // Cambiar meta de ventas
    const metaVentasInput = page.locator('[data-testid="input-meta-ventas"]');
    await metaVentasInput.fill('30');

    // Cambiar plazo SBS
    const plazoInput = page.locator('[data-testid="input-plazo-sbs"]');
    await plazoInput.fill('60');

    // Guardar
    const btnGuardar = page.locator('[data-testid="btn-guardar"]');
    await expect(btnGuardar).toBeEnabled();
    await btnGuardar.click();

    // Snackbar de éxito
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('Configuración guardada', { timeout: 8_000 });

    // PUT fue enviado
    await page.waitForTimeout(300);
    expect(capturedBodies.length).toBeGreaterThan(0);

    // El patch incluye el campo modificado
    expect(capturedBodies[0]['metaVentasMensual']).toBe(30);
    expect(capturedBodies[0]['plazoReevaluacionSbsDias']).toBe(60);
  });

  // ── Caso 3: maxIntentosNoContesto = 0 → cliente bloquea o backend 400 ───────

  test('maxIntentosNoContesto 0 es bloqueado por la validacion del cliente o muestra error 400 del backend', async ({ page }) => {
    await setup(page);
    await mockEstadoEmail(page, { mailConfigurado: true });
    await mockConfiguracion(page, {
      config: MOCK_CONFIGURACION_DEFAULT,
      failPut: true,
      failMessage: 'maxIntentosNoContesto debe ser al menos 1.',
    });

    await irAConfiguracion(page);

    const maxIntentosInput = page.locator('[data-testid="input-max-intentos"]');
    await maxIntentosInput.fill('0');
    // Forzar validación tocando el campo
    await maxIntentosInput.blur();

    const btnGuardar = page.locator('[data-testid="btn-guardar"]');

    // La validación de cliente (min=1) debe deshabilitar el botón Guardar
    await expect(btnGuardar).toBeDisabled({ timeout: 5_000 });
  });

  // ── Caso 4: Banner "email no configurado" cuando mailConfigurado=false ───────

  test('banner de email no configurado visible cuando mailConfigurado es false', async ({ page }) => {
    await setup(page);
    await mockEstadoEmail(page, { mailConfigurado: false });
    await mockConfiguracion(page, { config: MOCK_CONFIGURACION_DEFAULT });

    await irAConfiguracion(page);

    const banner = page.locator('[data-testid="banner-email-no-configurado"]');
    await expect(banner).toBeVisible({ timeout: 8_000 });
    await expect(banner).toContainText('MAIL_ENABLED');
  });

  // ── Caso 5 (RF-WA): Plantilla de WhatsApp se carga y se guarda ──────────────

  test('plantillaWhatsapp se carga en el textarea y se envía en el PUT al guardar', async ({ page }) => {
    const PLANTILLA = 'Hola {nombre}, soy {asesor} del equipo de ventas.';
    const capturedBodies: Array<Record<string, unknown>> = [];

    page.on('request', (req) => {
      if (req.url().includes('/api/reportes/config') && req.method() === 'PUT') {
        try { capturedBodies.push(JSON.parse(req.postData() ?? '{}')); } catch { /* */ }
      }
    });

    await setup(page);
    await mockEstadoEmail(page, { mailConfigurado: true });
    await mockConfiguracion(page, {
      config: { ...MOCK_CONFIGURACION_DEFAULT, plantillaWhatsapp: PLANTILLA },
    });

    await irAConfiguracion(page);

    // El textarea de plantilla debe tener el valor cargado del mock
    const textareaPlantilla = page.locator('[data-testid="textarea-plantilla-whatsapp"]');
    await expect(textareaPlantilla).toBeVisible({ timeout: 8_000 });
    await expect(textareaPlantilla).toHaveValue(PLANTILLA);

    // Modificar la plantilla
    const NUEVA_PLANTILLA = 'Buenos días {nombre}, le llama {asesor}.';
    await textareaPlantilla.fill(NUEVA_PLANTILLA);

    // Guardar
    const btnGuardar = page.locator('[data-testid="btn-guardar"]');
    await expect(btnGuardar).toBeEnabled();
    await btnGuardar.click();

    // Snackbar de éxito
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('Configuración guardada', { timeout: 8_000 });

    // El PUT contiene plantillaWhatsapp con el nuevo valor
    await page.waitForTimeout(300);
    expect(capturedBodies.length).toBeGreaterThan(0);
    expect(capturedBodies[0]['plantillaWhatsapp']).toBe(NUEVA_PLANTILLA);

    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/configuracion-whatsapp.png`,
      fullPage: true,
    });
  });

});
