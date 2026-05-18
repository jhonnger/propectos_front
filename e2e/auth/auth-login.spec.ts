import { test, expect } from '@playwright/test';
import { mockBackend } from '../support/mocks';

/**
 * E2E — Flujo de login (lo único user-facing que existe hoy, Fase 0).
 * Valida visualmente la pantalla y el comportamiento de autenticación.
 */
test.describe('Login', () => {
  test('la pantalla de login renderiza sus elementos', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Polaris CRM' })).toBeVisible();
    await expect(page.getByLabel('Usuario')).toBeVisible();
    await expect(page.getByLabel('Contrasena')).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar Sesion/i })).toBeVisible();

    await page.screenshot({ path: 'test-results/screenshots/login.png', fullPage: true });
  });

  test('submit vacío marca los campos requeridos y no navega', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/login');

    // El botón está deshabilitado con el form inválido (Validators.required).
    await expect(page.getByRole('button', { name: /Iniciar Sesion/i })).toBeDisabled();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login válido como ADMINISTRADOR navega a /admin y guarda token', async ({ page }) => {
    await mockBackend(page, { rol: 'ADMINISTRADOR' });
    await page.goto('/login');

    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contrasena').fill('Admin123!');
    await page.getByRole('button', { name: /Iniciar Sesion/i }).click();

    await expect(page).toHaveURL(/\/admin/);
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const rol = await page.evaluate(() => localStorage.getItem('userRole'));
    expect(token).toBeTruthy();
    expect(rol).toBe('ADMINISTRADOR');
    await page.screenshot({ path: 'test-results/screenshots/login-admin-ok.png', fullPage: true });
  });

  test('login válido como TELEOPERADOR navega a /user/app/dashboard', async ({ page }) => {
    await mockBackend(page, { rol: 'TELEOPERADOR' });
    await page.goto('/login');

    await page.getByLabel('Usuario').fill('colaborador');
    await page.getByLabel('Contrasena').fill('secret');
    await page.getByRole('button', { name: /Iniciar Sesion/i }).click();

    await expect(page).toHaveURL(/\/user\/app\/dashboard/);
    expect(await page.evaluate(() => localStorage.getItem('userRole'))).toBe('TELEOPERADOR');
  });

  test('login inválido muestra error y permanece en /login', async ({ page }) => {
    await mockBackend(page, { fail: true });
    await page.goto('/login');

    await page.getByLabel('Usuario').fill('admin');
    await page.getByLabel('Contrasena').fill('malpass');
    await page.getByRole('button', { name: /Iniciar Sesion/i }).click();

    await expect(page.getByText(/Credenciales incorrectas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: 'test-results/screenshots/login-error.png', fullPage: true });
  });
});
