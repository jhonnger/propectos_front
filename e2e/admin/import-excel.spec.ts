import { test, expect } from '@playwright/test';
import { mockBackend, mockImportarExcel, seedSession } from '../support/mocks';

/**
 * E2E — Importación Excel (RF-19, slice 1.1).
 *
 * Todos los casos usan mocks de red: no requieren backend real.
 */
test.describe('Importacion Excel', () => {
  test.beforeEach(async ({ page }) => {
    // Registrar catch-all primero, luego mocks específicos encima.
    await mockBackend(page, { rol: 'ADMINISTRADOR' });
    await seedSession(page, 'ADMINISTRADOR');
  });

  test('importar OK: muestra panel con Importados y fila rechazada', async ({ page }) => {
    await mockImportarExcel(page, {
      importados: 3,
      rechazados: 1,
      detalleRechazos: [{ fila: 5, motivo: 'Campos obligatorios faltantes: celular' }],
    });

    await page.goto('/admin/upload-excel');

    // Crear un archivo de prueba en memoria y subirlo via input oculto
    const fileContent = Buffer.from('PK mock xlsx content');
    await page.setInputFiles('input[type="file"]', {
      name: 'prospectos.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: fileContent,
    });

    // Click "Subir Archivo"
    await page.getByRole('button', { name: /Subir Archivo/i }).click();

    // El panel de resultado debe aparecer
    const resultPanel = page.locator('[data-testid="import-result"]');
    await expect(resultPanel).toBeVisible({ timeout: 8000 });

    // Importados: 3
    const statImportados = page.locator('[data-testid="stat-importados"]');
    await expect(statImportados).toContainText('3');
    await expect(statImportados).toContainText('Importados');

    // Rechazados: 1
    const statRechazados = page.locator('[data-testid="stat-rechazados"]');
    await expect(statRechazados).toContainText('1');

    // Tabla de rechazos: fila 5, motivo celular
    const rechazoRow = page.locator('[data-testid="rechazo-row"]').first();
    await expect(rechazoRow).toContainText('5');
    await expect(rechazoRow).toContainText('celular');

    await page.screenshot({
      path: 'test-results/screenshots/import-ok.png',
      fullPage: true,
    });
  });

  test('importar 400: muestra el mensaje de error real del backend', async ({ page }) => {
    await mockImportarExcel(page, {
      fail: true,
      failMessage: 'El archivo no contiene filas validas de prospectos.',
    });

    await page.goto('/admin/upload-excel');

    const fileContent = Buffer.from('not a real xlsx');
    await page.setInputFiles('input[type="file"]', {
      name: 'vacio.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: fileContent,
    });

    await page.getByRole('button', { name: /Subir Archivo/i }).click();

    // Panel de error debe aparecer con el mensaje exacto del backend
    const errorPanel = page.locator('[data-testid="import-error"]');
    await expect(errorPanel).toBeVisible({ timeout: 8000 });
    await expect(errorPanel).toContainText('El archivo no contiene filas validas de prospectos.');

    // El panel de resultado exitoso NO debe estar
    await expect(page.locator('[data-testid="import-result"]')).not.toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/import-error-400.png',
      fullPage: true,
    });
  });

  test('archivo mayor a 10 MB: muestra aviso de tamaño antes de subir', async ({ page }) => {
    // No necesitamos mock de importar; el error ocurre en cliente
    await page.goto('/admin/upload-excel');

    // Crear buffer > 10 MB
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 0);
    await page.setInputFiles('input[type="file"]', {
      name: 'grande.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: bigBuffer,
    });

    // El archivo NO debe quedar seleccionado (el handler de validación lo rechaza)
    // y debe aparecer un snackbar con el mensaje de tamaño
    await expect(page.getByText(/supera el limite de 10 MB/i)).toBeVisible({ timeout: 4000 });

    await page.screenshot({
      path: 'test-results/screenshots/import-size-error.png',
      fullPage: true,
    });
  });
});
