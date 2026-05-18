# Pruebas E2E (Playwright)

Validación funcional **y visual** del frontend. Cada fase del plan agrega specs aquí.

## Correr

```bash
cd propectos_front
npm run e2e          # headless, levanta ng serve automáticamente
npm run e2e:ui       # modo interactivo (UI mode)
npm run e2e:report   # abre el último reporte HTML
```

- El frontend se levanta solo (`webServer` en `playwright.config.ts`, `ng serve`).
- Reporte HTML en `playwright-report/`. Screenshots y videos en `test-results/`
  (incluye `test-results/screenshots/*.png` como evidencia visual de cada pantalla).

## Modo mock (por defecto) vs backend real

- **Por defecto:** el backend se **mockea** por intercepción de red
  (`e2e/support/mocks.ts`). No requiere Postgres ni Spring; es determinista.
- **Backend real (integración):** exporta `E2E_BASE_API` apuntando al backend
  (los mocks se desactivan automáticamente):

  ```bash
  E2E_BASE_API=http://localhost:8081 npm run e2e
  ```

  En ese modo necesitas el backend levantado y la BD migrada
  (ver `Seguimientos_Prospecto_bases/.env.example` y `PLAN_DESARROLLO.md`).
  Credenciales bootstrap: `admin` / `Admin123!`.

## Estructura

```
e2e/
  support/mocks.ts        # helpers: mockBackend(), seedSession()
  auth/auth-login.spec.ts # login: render, validación, éxito admin/teleop, error
  auth/route-guards.spec.ts # guards: rutas protegidas e inexistentes → /login
```

Convención: una carpeta por área (`auth/`, `admin/`, `colaborador/`…). Al
implementar Fase 1+ se agregan specs (wizard SBS, cola, dashboard, etc.) en su
carpeta, con `data-testid` cuando un selector por rol/label no sea estable.
