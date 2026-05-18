import { test, expect, Page } from '@playwright/test';
import {
  mockBackend,
  mockJornada,
  mockMisProspectos,
  mockMisEstadisticas,
  mockMiActividad,
  seedSession,
} from '../support/mocks';

/**
 * E2E — Control de jornada del colaborador (RF-21, Slice 2.2).
 *
 * El control de jornada vive en el navbar del dashboard del colaborador.
 * Todos los casos usan mocks; no requieren backend real.
 */

const SCREENSHOTS_DIR = 'test-results/screenshots';

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'TELEOPERADOR' });
  await mockMisEstadisticas(page);
  await mockMiActividad(page);
  await mockMisProspectos(page);
  await seedSession(page, 'TELEOPERADOR');
}

async function irAlDashboard(page: Page): Promise<void> {
  await page.goto('/user/app/dashboard');
  // Esperar a que el navbar esté visible
  await expect(page.locator('app-navbar')).toBeVisible({ timeout: 10_000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Jornada del colaborador — Slice 2.2 (RF-21)', () => {

  // ── Caso 1: estado inicial "no iniciada" → botón Iniciar visible ─────────────

  test('estado inicial: muestra boton Iniciar jornada cuando no hay jornada', async ({ page }) => {
    await setup(page);
    await mockJornada(page, {
      estadoInicial: { iniciada: false, finalizada: false },
    });

    await irAlDashboard(page);

    const btnIniciar = page.locator('[data-testid="btn-iniciar-jornada"]');
    await expect(btnIniciar).toBeVisible({ timeout: 8_000 });
    await expect(btnIniciar).toContainText('Iniciar jornada');

    // No debe verse el botón de finalizar
    await expect(page.locator('[data-testid="btn-finalizar-jornada"]')).not.toBeVisible();

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/jornada.png`, fullPage: true });
  });

  // ── Caso 2: click en Iniciar → aparece estado "iniciada" + botón Finalizar ──

  test('click en Iniciar jornada → mock devuelve iniciada → aparece Finalizar', async ({ page }) => {
    await setup(page);
    await mockJornada(page, {
      estadoInicial: { iniciada: false, finalizada: false },
      estadoTrasIniciar: {
        iniciada: true,
        finalizada: false,
        inicio: '2026-05-18T08:00:00',
        fin: null,
      },
    });

    await irAlDashboard(page);

    // Esperar que aparezca el botón de iniciar
    const btnIniciar = page.locator('[data-testid="btn-iniciar-jornada"]');
    await expect(btnIniciar).toBeVisible({ timeout: 8_000 });

    await btnIniciar.click();

    // Tras el POST, debe aparecer el botón Finalizar
    const btnFinalizar = page.locator('[data-testid="btn-finalizar-jornada"]');
    await expect(btnFinalizar).toBeVisible({ timeout: 8_000 });
    await expect(btnFinalizar).toContainText('Finalizar');

    // El indicador de estado debe mostrar la hora de inicio
    const estadoDiv = page.locator('[data-testid="jornada-estado"]');
    await expect(estadoDiv).toContainText('08:00');

    // El botón de iniciar ya no debe estar visible
    await expect(page.locator('[data-testid="btn-iniciar-jornada"]')).not.toBeVisible();
  });

  // ── Caso 3: click en Finalizar → estado finalizada (sin botón) ─────────────

  test('click en Finalizar jornada → estado finalizada sin botones', async ({ page }) => {
    await setup(page);
    await mockJornada(page, {
      // Empieza ya iniciada
      estadoInicial: {
        iniciada: true,
        finalizada: false,
        inicio: '2026-05-18T08:00:00',
        fin: null,
      },
      estadoTrasFinalizar: {
        iniciada: true,
        finalizada: true,
        inicio: '2026-05-18T08:00:00',
        fin: '2026-05-18T17:00:00',
      },
    });

    await irAlDashboard(page);

    // Debe verse el botón Finalizar desde el estado inicial
    const btnFinalizar = page.locator('[data-testid="btn-finalizar-jornada"]');
    await expect(btnFinalizar).toBeVisible({ timeout: 8_000 });

    await btnFinalizar.click();

    // Tras el POST, el estado es finalizado: ni Iniciar ni Finalizar
    await expect(page.locator('[data-testid="btn-iniciar-jornada"]')).not.toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[data-testid="btn-finalizar-jornada"]')).not.toBeVisible({ timeout: 8_000 });

    // Debe mostrarse el chip con horas inicio–fin
    const estadoDiv = page.locator('[data-testid="jornada-estado"]');
    await expect(estadoDiv).toContainText('08:00');
    await expect(estadoDiv).toContainText('17:00');
  });

  // ── Caso 4: POST finalizar 400 → snackbar con mensaje del backend ───────────

  test('POST finalizar 400 → snackbar muestra el mensaje real del backend', async ({ page }) => {
    await setup(page);
    await mockJornada(page, {
      estadoInicial: {
        iniciada: true,
        finalizada: false,
        inicio: '2026-05-18T08:00:00',
        fin: null,
      },
      failFinalizar: true,
      failMessage: 'La jornada no ha sido iniciada.',
    });

    await irAlDashboard(page);

    const btnFinalizar = page.locator('[data-testid="btn-finalizar-jornada"]');
    await expect(btnFinalizar).toBeVisible({ timeout: 8_000 });
    await btnFinalizar.click();

    // Debe aparecer un snackbar con el mensaje real
    const snackbar = page.locator('mat-snack-bar-container, simple-snack-bar, .mdc-snackbar__label');
    await expect(snackbar.first()).toContainText('La jornada no ha sido iniciada.', { timeout: 8_000 });
  });

  // ── Caso 5: el control de jornada NO aparece para el administrador ───────────

  test('el control de jornada NO es visible en el panel admin', async ({ page }) => {
    await mockBackend(page, { rol: 'ADMINISTRADOR' });
    await seedSession(page, 'ADMINISTRADOR');

    await page.goto('/admin/dashboard');
    await page.waitForTimeout(2000);

    // El botón de iniciar no debe existir en el panel admin
    await expect(page.locator('[data-testid="btn-iniciar-jornada"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="btn-finalizar-jornada"]')).not.toBeVisible();
  });

});
