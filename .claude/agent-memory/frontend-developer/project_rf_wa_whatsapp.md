---
name: project_rf_wa_whatsapp
description: RF-WA WhatsApp feature — endpoints, phone normalization, panel trigger mechanism, and Angular template escaping gotchas
metadata:
  type: project
---

## RF-WA: Enviar WhatsApp al prospecto

### Endpoints integrados
- `GET /api/whatsapp/plantilla` → `{ plantilla: string }` (variables: `{nombre}`, `{asesor}`)
- `GET /api/whatsapp/mi-tarjeta/existe` → `{ existe: boolean }`
- `GET /api/whatsapp/mi-tarjeta` → Blob image/* (path exacto — usar predicado fn para no capturar /existe)
- `POST /api/whatsapp/usuario/{id}/tarjeta` (admin only) → `{ ok, bytes }` body: `{ contentType, base64 }`

### Normalización de teléfono (Perú)
- Quitar todo lo no-dígito
- Si quedan 9 dígitos → agregar prefijo `51`
- Si ya empieza con `51` y tiene 11 dígitos → OK
- Cualquier otro resultado → string vacío → botón deshabilitado

**Why:** el campo `celular` en `WizardDialogData` viene SIN enmascarar (el backend ya lo manda limpio al wizard).

### Panel visible cuando
- `ramaLlamada === 'contesto'`
- `quienContestoSeleccionado === 'titular'`
- `titularOpcionSeleccionada.resultado` ∈ `{INTERESADO, AGENDADO, VOLVER_LLAMAR, DERIVADO}`

### Trigger de inicialización
Se llama `inicializarPanelWhatsapp()` desde `seleccionarTitularOpcion()` cuando `mostrarPanelWhatsapp` es true. La plantilla se cachea en `plantillaCache` para no re-consultar al backend si el usuario cambia de opción.

### Nombre del asesor
`AuthService.getUsername()` — devuelve el nombre guardado en `localStorage.userName` al hacer login.

### Angular template escaping
Las llaves literales `{nombre}` en textos estáticos de templates se interpretan como ICU messages → usar `&#123;nombre&#125;` en atributos como `placeholder`, y `{{ '{' }}nombre{{ '}' }}` en contenido de texto (como `mat-hint`).

**Why:** el compilador de Angular lanza `NG5002: Invalid ICU message` si hay `{...}` sin cerrar en el contenido del template.

### Descarga de blob (tarjeta)
Patrón idéntico a `exportarExcel()` en dashboard-admin:
```ts
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'mi-tarjeta-whatsapp';
a.click();
window.URL.revokeObjectURL(url);
```
