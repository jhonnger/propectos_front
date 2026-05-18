import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración E2E (Playwright) — Sistema de Seguimiento de Prospectos (frontend).
 *
 * Por defecto los specs MOCKEAN el backend (intercepción de red) → deterministas,
 * no necesitan Postgres ni Spring corriendo.
 *
 * Modo backend real (opcional): definir E2E_BASE_API con la URL del backend
 * (ej. http://localhost:8081). Los helpers de mock se desactivan si está presente.
 *
 * El frontend se levanta automáticamente con `ng serve` (webServer).
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // Puerto dedicado 4300 para e2e: evita colisión con otros `ng serve`
    // (hay otra app Angular en 4200 en este equipo). NO usar 4200.
    baseURL: 'http://localhost:4300',
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Levanta `ng serve` y lo reutiliza si ya está corriendo.
  webServer: {
    // Levanta NUESTRO ng serve en 4300 (no reusar: en 4200 corre otra app).
    command: 'npm start -- --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
