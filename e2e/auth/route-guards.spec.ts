import { test, expect } from '@playwright/test';
import { mockBackend, seedSession } from '../support/mocks';

/**
 * E2E — Guards de ruta (valida Fase 0.4).
 * Sin sesión, las rutas protegidas y las inexistentes redirigen a /login.
 */
test.describe('Guards de ruta', () => {
  test('/user/app/dashboard sin token → redirige a /login', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/user/app/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/admin sin token (sin rol) → redirige a /login', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('ruta inexistente → redirige a /login', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/cualquier-cosa-que-no-existe');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/admin con token de TELEOPERADOR (rol insuficiente) → redirige a /login', async ({ page }) => {
    await mockBackend(page);
    await seedSession(page, 'TELEOPERADOR');
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/user/app/dashboard con sesión válida NO redirige a /login', async ({ page }) => {
    await mockBackend(page, { rol: 'TELEOPERADOR' });
    await seedSession(page, 'TELEOPERADOR');
    await page.goto('/user/app/dashboard');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/user\/app\/dashboard/);
  });
});
