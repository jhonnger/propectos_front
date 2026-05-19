import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import {
  mockBackend,
  mockSubirTarjeta,
  seedSession,
  MOCK_USUARIOS,
} from '../support/mocks';

/**
 * E2E — Gestión de usuarios (manage-users), RF-WA: subir tarjeta WhatsApp.
 *
 * Todos los casos usan mocks de red; no requieren backend real.
 */

// Fixture de usuarios para la tabla
const MOCK_USERS_ACTIVOS = MOCK_USUARIOS.map((u) => ({
  ...u,
  estado: true,
  nombreCompleto: `${u.nombre} ${u.apellidos}`,
}));

async function setup(page: Page): Promise<void> {
  await mockBackend(page, { rol: 'ADMINISTRADOR' });

  // GET /api/usuarios/activos — lista de usuarios
  await page.route('**/api/usuarios/activos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USERS_ACTIVOS),
    });
  });

  // GET /api/usuarios/roles
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

  // PUT /api/usuarios/{id} (actualizar)
  await page.route('**/api/usuarios/*', async (route) => {
    if (route.request().method() !== 'PUT') { await route.fallback(); return; }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USERS_ACTIVOS[0]),
    });
  });

  await seedSession(page, 'ADMINISTRADOR');
}

async function irAManageUsers(page: Page): Promise<void> {
  await page.goto('/admin/manage-users');
  // Esperar que la tabla cargue
  await expect(page.locator('tr.mat-mdc-row, tr.mdc-data-table__row, .mobile-card').first()).toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Abre el diálogo de edición del primer usuario de la tabla.
 */
async function abrirDialogoEdicion(page: Page): Promise<void> {
  const editBtn = page.locator('button[mattooltip="Editar"], button[ng-reflect-message="Editar"]').first();
  if (await editBtn.count() === 0) {
    // Fallback: buscar botón con ícono "edit" dentro de las acciones
    await page.locator('.edit-btn').first().click();
  } else {
    await editBtn.click();
  }
  // Esperar que el dialog se abra
  await expect(page.locator('[data-testid="tarjeta-whatsapp-section"]')).toBeVisible({ timeout: 8_000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Manage Users — RF-WA: subir tarjeta WhatsApp', () => {

  // ── Caso 1: Sección tarjeta visible en modo edición ────────────────────────

  test('la seccion tarjeta WhatsApp aparece en el dialogo de edicion', async ({ page }) => {
    await setup(page);
    await irAManageUsers(page);
    await abrirDialogoEdicion(page);

    const section = page.locator('[data-testid="tarjeta-whatsapp-section"]');
    await expect(section).toBeVisible();

    const btnSubir = page.locator('[data-testid="btn-subir-tarjeta"]');
    await expect(btnSubir).toBeVisible();
    await expect(btnSubir).toBeEnabled();
  });

  // ── Caso 2: Subir imagen válida llama al POST /api/whatsapp/usuario/{id}/tarjeta ──

  test('subir imagen válida hace POST a /api/whatsapp/usuario/{id}/tarjeta con base64 y snackbar de éxito', async ({ page }) => {
    const capturedRequests: Array<{ url: string; body: Record<string, unknown> }> = [];

    await setup(page);
    await mockSubirTarjeta(page);

    page.on('request', (req) => {
      if (req.url().includes('/api/whatsapp/usuario/') && req.url().includes('/tarjeta') && req.method() === 'POST') {
        try {
          capturedRequests.push({
            url: req.url(),
            body: JSON.parse(req.postData() ?? '{}') as Record<string, unknown>,
          });
        } catch { /* */ }
      }
    });

    await irAManageUsers(page);
    await abrirDialogoEdicion(page);

    // Usar setInputFiles para simular selección de archivo
    const fileInput = page.locator('[data-testid="input-tarjeta-whatsapp"]');
    await fileInput.setInputFiles({
      name: 'tarjeta.png',
      mimeType: 'image/png',
      // Contenido mínimo: PNG 1x1 pixel en base64
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      ),
    });

    // Esperar snackbar de éxito
    const snack = page.locator('simple-snack-bar');
    await expect(snack).toContainText('Tarjeta WhatsApp subida', { timeout: 8_000 });

    // Verificar que se llamó al POST correcto
    await page.waitForTimeout(300);
    expect(capturedRequests.length).toBeGreaterThan(0);
    const req = capturedRequests[0];
    // URL debe incluir el userId (2 = primer usuario del fixture MOCK_USUARIOS)
    expect(req.url).toMatch(/\/api\/whatsapp\/usuario\/\d+\/tarjeta/);
    // Body debe tener contentType y base64
    expect(typeof req.body['contentType']).toBe('string');
    expect((req.body['contentType'] as string).startsWith('image/')).toBe(true);
    expect(typeof req.body['base64']).toBe('string');
    // base64 no debe tener el prefijo data:
    expect(req.body['base64'] as string).not.toContain('data:');
  });

  // ── Caso 3: Archivo >2MB muestra error de validación de cliente ────────────

  test('imagen mayor a 2MB muestra error de validación en cliente sin llamar al backend', async ({ page }) => {
    const tarjetaRequests: string[] = [];

    await setup(page);
    await mockSubirTarjeta(page);

    page.on('request', (req) => {
      if (req.url().includes('/api/whatsapp/usuario/') && req.method() === 'POST') {
        tarjetaRequests.push(req.url());
      }
    });

    await irAManageUsers(page);
    await abrirDialogoEdicion(page);

    // Crear un buffer de 3MB (supera el límite de 2MB)
    const oversizedBuffer = Buffer.alloc(3 * 1024 * 1024, 0xff);

    const fileInput = page.locator('[data-testid="input-tarjeta-whatsapp"]');
    await fileInput.setInputFiles({
      name: 'grande.png',
      mimeType: 'image/png',
      buffer: oversizedBuffer,
    });

    // El error de tamaño debe aparecer
    const errorElem = page.locator('[data-testid="tarjeta-error"]');
    await expect(errorElem).toBeVisible({ timeout: 5_000 });
    await expect(errorElem).toContainText('2 MB');

    // No se debe haber llamado al backend
    await page.waitForTimeout(300);
    expect(tarjetaRequests.length).toBe(0);
  });

});
