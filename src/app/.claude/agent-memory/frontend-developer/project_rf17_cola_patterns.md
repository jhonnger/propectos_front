---
name: rf17-cola-colaborador-patterns
description: Patterns, types and E2E conventions established in RF-17 slice 1.2 (cola del colaborador)
metadata:
  type: project
---

## ProspectoService — new API contract (slice 1.2)

`getMisProspectos(filtro, busqueda?, pagina, tamanioPagina)` — replaces old `estado/estadoResultado` params. `filtro` is a `FiltroColaborador` union type; `busqueda` is optional free text.

`getMiActividad()` — new method, returns `MiActividad`.

`getMisEstadisticas()` — unchanged endpoint but `MisEstadisticas` interface now has `enSeguimiento`, `derivados`, `ganados`, `descartados` (old fields like `finalizados`, `agendados` made optional for backward compat).

## MiProspecto — full typed interface

Added fields: `asignacionId`, `celularMasked`, `verificacionSbs`, `fechaReevaluacionSbs`, `proximaLlamada`, `intentosFallidos`, `nroPrestamosConcretados`, `vencido`, `futuro`.

## Dashboard component patterns

- Uses `ChangeDetectionStrategy.OnPush` + `cdr.markForCheck()` after async updates.
- Debounce via `Subject<string>` + `debounceTime(400)` + `distinctUntilChanged()` in `ngOnInit`.
- `mat-tab-group` with lazy activation: actividad tab calls `cargarActividad()` only on first open; result cached in `actividad` field (reset to `null` after a contact is registered to force refresh).
- Row classes: `row-vencido` (red left border, red bg) via `[ngClass]="getRowClass(row)"`. `row-futuro` = reduced opacity.
- Badge "Cliente recurrente" shown when `nroPrestamosConcretados >= 1`.
- Error shown in `.error-banner[data-testid="error-banner"]` from `err?.error?.message ?? err?.error?.mensaje`.
- Filtros de solo lectura (DERIVADOS, MIS_VENTAS, DESCARTADOS): `esSoloLectura()` disables the Gestionar button.

## E2E mock patterns for RF-17

`mockMisProspectos(page, opts)` — registers AFTER `mockBackend()`. Reads `filtro` from URL params to echo it back in the response. `opts.fail=true` returns 400 with `message`.

`mockMiActividad(page)` and `mockMisEstadisticas(page)` — simple 200 mocks; also registered after `mockBackend()`.

Fixtures: `MOCK_PROSPECTO_VENCIDO` (`vencido:true`), `MOCK_PROSPECTO_RECURRENTE` (`nroPrestamosConcretados:2`), `MOCK_PROSPECTO_NORMAL`.

## Pitfall: `.toBeVisible()` on mobile-only elements

`phone-masked` span is inside `.mobile-only` (display:none on desktop viewport). Use `.toBeAttached()` or check page content with `pageContent.includes(...)` instead of `toBeVisible()` when the element may be in a hidden responsive zone.

## Related

See [[rf19-slice11-patterns]] for general mock ordering, `data-testid` convention, and E2E helper pattern.

**Why:** Slice 1.2 was implemented 2026-05-17 with 22/22 E2E passing.
**How to apply:** Use these interfaces and patterns as foundation for slice 1.3 (wizard de atención).
