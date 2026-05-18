---
name: project-rf19-patterns
description: RF-19 slice 1.1 implementation patterns: typed API interfaces, result panels, multi-assign flow, E2E mock strategy
metadata:
  type: project
---

RF-19 (slice 1.1) was implemented with the following decisions:

**AdminService typed interfaces:** `ImportacionResult`, `DetalleRechazo`, `AsignacionMultiItem`, `AsignacionMultiResponse` defined in `admin.service.ts`. `uploadExcel` now returns `Observable<ImportacionResult>`. New method `asignarMulti` posts to `/api/asignaciones/asignar-multi`.

**upload-excel result panel:** After successful import, an inline result panel (not snackbar) shows importados/rechazados counters and a rechazos table. On HTTP 400, `error.error.message` is shown verbatim. Client-side 10 MB size guard fires before any HTTP call.

**assign-prospects multi-panel:** Each `ExcelLoad` view-model now has `showMultiPanel`, `multiRows`, `multiResult`, `multiError`. The "Repartir" button opens an expandable inline panel with dynamic row list, live saldo counter, overflow warning, and a "Confirmar reparto" button disabled when sum > disponibles or any row is incomplete. The old `assignPartial` method is retained but hidden from the main flow.

**E2E mock strategy:** `mockBackend` registers catch-all first; specific mocks (`mockImportarExcel`, `mockAsignacionMulti`) are registered after — Playwright evaluates LIFO so the specific handler wins. `mockAsignacionMulti` also stubs `/api/cargas-masivas` and `/api/usuarios/no-admins`. Locating filename in assign-multi specs must use `.load-filename` class (not `getByText`) to avoid strict-mode violation (filename appears in both desktop table and mobile card).

**Why:** `getByText('filename.xlsx')` matched 2 elements in strict mode because the component renders both desktop table and mobile card views simultaneously.

**How to apply:** When writing E2E for assign-prospects, always use `.load-filename` class selector or a `[data-testid]` attribute to scope to one element.
