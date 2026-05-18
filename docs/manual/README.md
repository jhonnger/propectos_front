# Manuales de usuario

Fuente versionada de los manuales del sistema:

- `MANUAL_ADMIN.md` — manual del dueño / administrador.
- `MANUAL_COLABORADOR.md` — manual del colaborador (teleoperador).
- `img/admin/`, `img/colab/` — capturas de pantalla.

## Regenerar PDF y Word

Los entregables `.pdf` y `.docx` se generan desde los `.md` (no se versionan):

```bash
cd docs/manual
npm install
npm run build        # genera MANUAL_*.pdf y MANUAL_*.docx
```

Requiere Google Chrome instalado (se usa headless para el PDF).

## Regenerar las capturas

Las imágenes se capturan con Playwright contra el harness de mocks
(determinista, sin backend):

```bash
cd ../..                # raíz de propectos_front
npx playwright test e2e/manual/manual-capture.spec.ts --workers=1
```

Si cambia una pantalla, vuelva a capturar y luego `npm run build`.
