---
name: project_rf13_wizard_patterns
description: Wizard de atención (RF-04/13/14/15) implementation patterns — service contract, dialog data shape, E2E mock pitfalls
metadata:
  type: project
---

## Wizard de Atención — Slice 1.3 (RF-04/13/14/15)

Implemented as a rewrite of `update-prospect-dialog.component.*` (3 files).

### Service contract (ProspectoService)

New typed methods added:
- `abrirModal(prospectoId)` → POST /api/contactos/apertura → `AperturaResponse { aperturaId, inicio }`
- `cerrarApertura(aperturaId)` → POST /api/contactos/apertura/{id}/cerrar → `{ ok: boolean }`
- `getHistorialWizard(prospectoId)` → GET /api/contactos/historial/{id} → `HistorialContacto[]`
- `verificarSbs(payload)` → POST /api/contactos/verificacion-sbs → `VerificacionSbsResponse`
- `registrarAtencion(payload)` → POST /api/contactos → `AtencionResponse { ok, estado, proximaLlamada }`

All types are in `prospecto.service.ts`. Legacy `registrarContacto` and `getHistorial` are kept `@deprecated`.

### WizardDialogData shape

```ts
export interface WizardDialogData {
  prospectoId: number;
  nombre: string;
  apellido: string;
  celular: string;
  documentoIdentidad: string;
  estadoActual: string | null;
}
```

Dashboard passes this directly — no longer uses `{ id, name, phone }` shape.

### Dialog opened from dashboard

```ts
this.dialog.open<UpdateProspectDialogComponent, WizardDialogData, WizardDialogResult | null>(
  UpdateProspectDialogComponent,
  { width: '560px', maxWidth: '95vw', maxHeight: '90vh', panelClass: 'custom-dialog-panel', data: wizardData, disableClose: true }
)
```

`disableClose: true` forces use of Cancel button so `cerrarApertura` is always called on exit.

### Key design decisions

- `aperturaPendiente = true` guard: all wizard content is inside `@if (!aperturaPendiente)` — apertura failure is silently recovered (best-effort)
- SBS is step 0, BLOQUEANTE: `wizard-llamada` div has `pointer-events: none` when `pasoSbs !== 'apto'`
- OBSERVADO closes modal automatically after 2.5s (`setTimeout(() => dialogRef.close(null), 2500)`) and sets `registroConfirmado = true` so cerrarApertura is NOT called
- Cronómetro via `setInterval` updated with `cdr.markForCheck()` (OnPush)

### E2E mock pitfalls (CRITICAL)

1. **`button:has-text("Gestionar")` matches the filter chip "Sin gestionar"**. Use `button[aria-label="Gestionar prospecto"]` instead.
2. **`**/api/contactos` glob matches ALL subpaths** including `/api/contactos/apertura`. Use a predicate function `(url) => new URL(url).pathname.endsWith('/api/contactos')` for exact-path matching.
3. **Playwright LIFO handler ordering**: the LAST `page.route()` call gets highest priority. Register more-specific mocks AFTER less-specific ones so they take priority.
4. **Predicate-based routes** skip handlers where predicate returns false — so stacking specific predicates works correctly.
5. **Historial renders labels not codes**: check for "No contestó" not "NO_CONTESTO" in page content assertions.

### New mocks added to e2e/support/mocks.ts

- `mockApertura(page, opts)` — POST /api/contactos/apertura (predicate-based)
- `mockCerrarApertura(page)` — POST /api/contactos/apertura/*/cerrar
- `mockHistorial(page, opts)` — GET /api/contactos/historial/**
- `mockVerificacionSbs(page, opts)` — POST /api/contactos/verificacion-sbs
- `mockRegistrarAtencion(page, opts)` — POST /api/contactos (predicate-based, exact path)

**Why:** see E2E mock pitfalls above.
**How to apply:** always use predicate functions for routes that could be prefix-matched by other routes.
