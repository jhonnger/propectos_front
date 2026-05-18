# Manual del Colaborador (Teleoperador)
### Sistema de Seguimiento de Prospectos

Guía para el **colaborador**: cómo trabajar su cola de prospectos, hacer la verificación SBS, registrar cada llamada y no perder a ningún cliente interesado.

---

## 1. Acceso e inicio de jornada

Ingrese la URL del sistema y escriba su **usuario** y **contraseña**.

![Inicio de sesión](img/admin/01-login.png)

> Al **primer ingreso del día** su **jornada se inicia automáticamente** (no tiene que marcarla a mano). El dueño ve su asistencia en el tablero.

---

## 2. Su cola de prospectos

Tras ingresar verá su lista de prospectos asignados.

![Cola del colaborador](img/colab/01-cola.png)

- Cada fila es un prospecto con su estado, campaña y datos de contacto.
- Los **vencidos** (seguimiento atrasado) se resaltan para que no se pierdan.
- Use los **filtros** para ver, por ejemplo, “para hoy”, agendados, sin gestionar, etc.
- Verá el **DNI y el celular completos** de sus prospectos (los necesita para consultar SBS y para llamar).

Para trabajar un prospecto, ábralo: se muestra la pantalla de **Atención al Prospecto**.

---

## 3. Atención al Prospecto (wizard guiado)

Al abrir un prospecto inicia un **cronómetro** (mide el tiempo de gestión, incluida la consulta SBS) y se ve el **historial** de contactos previos.

![Apertura del wizard](img/colab/02-wizard-apertura.png)

El registro es **guiado paso a paso**. No se puede saltar pasos.

### Paso 0 — Verificación SBS (obligatorio)

Antes de llamar, consulte el documento del prospecto en el sistema SBS y marque el resultado:

- **APTO:** el cliente puede continuar. Se habilitan los siguientes pasos.

![SBS APTO](img/colab/03-wizard-sbs-apto.png)

- **OBSERVADO:** el cliente no es apto ahora. El caso se reprograma automáticamente para una reevaluación futura y el modal se cierra (no se registra llamada).

### Paso 1 — ¿Contestaron la llamada?

![¿Contestó?](img/colab/04-wizard-contesto.png)

- **No contestó:** elija el submotivo (no contesta, buzón, ocupado, apagado, número equivocado). El sistema **sugiere automáticamente** la próxima fecha/hora de llamada (puede editarla). Si se supera el máximo de intentos, el caso se descarta como ilocalizable.
- **Sí, contestó:** continúe al siguiente paso.

### Paso 2 — ¿Quién contestó?

![¿Quién contestó?](img/colab/05-wizard-quien.png)

- **Titular** — siga al resultado de la conversación.
- **Tercero** — se registra para volver a llamar.
- **Equivocado** — número no corresponde al titular.

### Paso 3 — Resultado de la conversación

![Resultados](img/colab/06-wizard-resultados.png)

| Opción | Qué hace |
|---|---|
| **Interesado** | El cliente mostró interés. Se programa un **seguimiento** (ver punto 4). |
| **Agendar cita** | Cita con fecha y hora; queda en seguimiento. |
| **Llamar después** | Recontacto con fecha y hora; queda en seguimiento. |
| **Derivar (ACEPTÓ)** | El cliente aceptó. El caso pasa al dueño para que **cierre la venta**. *(Final para el colaborador.)* |
| **No volver a llamar** | Cierre negativo: el caso se descarta. *(Final.)* |

> El colaborador **no** marca la venta: cuando el cliente acepta usa **Derivar (ACEPTÓ)** y el dueño concreta la venta.

---

## 4. “Interesado”: nunca se pierde el cliente

Cuando marca **Interesado**, el sistema **NO** deja el caso suelto: lo agenda como **seguimiento**.

![Interesado con fecha de seguimiento](img/colab/07-wizard-interesado.png)

- Aparece un campo de **fecha de seguimiento** ya **pre-llenado** con una sugerencia (próximo día hábil).
- Puede **editarla** libremente (debe ser futura y día laborable).
- El caso queda **en seguimiento** y entra a su cola con esa fecha; si se vence, se resalta. Así un interesado no se enfría sin que nadie lo vea.

De forma similar, **Agendar cita** y **Llamar después** piden fecha y hora:

![Agendar cita](img/colab/08-wizard-agendar.png)

---

## 5. Comentario y registro

- Agregue un **comentario** (opcional) con observaciones de la gestión.
- Presione **Registrar atención**. Se guarda el resultado, se detiene el cronómetro y el caso se actualiza según lo elegido.
- Si cierra el modal **sin registrar**, no se guarda resultado (solo queda el evento de apertura).

---

## 6. Mi actividad

Vista **Mi actividad**: lo que usted gestionó hoy.

![Mi actividad](img/colab/09-mi-actividad.png)

- Total de atenciones del día y resumen por resultado.
- Lista de gestiones con hora, resultado y comentario.

Úsela para llevar control de su propio avance durante la jornada.

---

## 7. Resumen rápido

1. Ingrese (su jornada inicia sola).
2. Abra un prospecto de su cola → arranca el cronómetro.
3. **Paso 0: SBS** (APTO para continuar / OBSERVADO reprograma).
4. ¿Contestó? → ¿Quién? → **Resultado**.
5. **Interesado / Agendar / Llamar después** = quedan con fecha (no se pierden).
6. **Derivar (ACEPTÓ)** = pasa al dueño para cerrar la venta.
7. Comentario → **Registrar atención**.
8. Revise **Mi actividad** para su control.

---

*Fin del Manual del Colaborador.*
