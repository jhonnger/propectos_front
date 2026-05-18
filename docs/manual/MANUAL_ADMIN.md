# Manual del Administrador
### Sistema de Seguimiento de Prospectos

Guía para el **dueño / administrador**: carga de bases, asignación a colaboradores, control de la operación, cierre de ventas y configuración.

---

## 1. Acceso al sistema

Ingrese la URL del sistema en el navegador. Verá la pantalla de inicio de sesión.

1. Escriba su **usuario** y **contraseña**.
2. Presione **Iniciar sesión**.

![Inicio de sesión](img/admin/01-login.png)

> **Importante (seguridad):** el usuario inicial `admin` trae una contraseña por defecto. En el primer ingreso, cree su usuario real desde **Usuarios** y cambie o desactive el `admin` por defecto.

---

## 2. Tablero (Dashboard)

Es la primera pantalla al entrar. Resume el estado de toda la operación.

![Dashboard del administrador](img/admin/02-dashboard.png)

Contiene:

- **Métricas de Hoy y del Mes:** ventas cerradas, derivados, atenciones, contactabilidad real, tasa de conversión, % de avance de bases, disponibles sin asignar.
- **Ranking por colaborador:** desempeño de cada teleoperador.
- **Embudo:** asignados → gestionados → contactados → interesados → derivados → ventas.
- **Por cerrar:** cantidad de casos derivados esperando que usted cierre la venta.
- **Asistencia de hoy:** colaboradores presentes/ausentes (la ausencia se marca solo en días laborables, pasada la hora de inicio + tolerancia).
- **Casos “En riesgo”:** prospectos de colaboradores ausentes que deben reasignarse para no perderlos. La tarjeta lleva directo a la pantalla de Reasignación.
- **Estado de bases:** avance de cada base cargada.

---

## 3. Cargar una base (Excel)

Menú **Cargar Excel**.

![Cargar Excel](img/admin/03-upload-excel.png)

1. Prepare el archivo `.xlsx` con las columnas en este orden: **nombre, apellido, campaña, documento, celular**. La primera fila es el encabezado.
2. Seleccione el archivo y súbalo.
3. El sistema muestra cuántos prospectos se **importaron** y cuántas filas se **rechazaron** (con el detalle del motivo).

Cada archivo cargado es una **base**; queda disponible para repartir entre los colaboradores.

---

## 4. Asignar prospectos a los colaboradores

Menú **Asignar prospectos**.

![Asignar prospectos](img/admin/04-assign-prospects.png)

1. Elija la **base** cargada.
2. Indique **cuántos** prospectos asignar a cada colaborador (reparto por cantidad exacta).
3. Confirme. El sistema muestra el **saldo sin asignar** y registra **quién asignó y cuándo** (auditoría).

Puede repartir una misma base entre varios colaboradores en un solo flujo.

---

## 5. Gestión de usuarios

Menú **Usuarios**. Lista los usuarios del sistema con su rol y estado.

![Gestión de usuarios](img/admin/05-manage-users.png)

Para crear o editar, se abre un formulario:

![Crear / editar usuario](img/admin/06-user-dialog.png)

- **Crear:** nombre, apellidos, usuario, email, contraseña y **rol** (ADMINISTRADOR o TELEOPERADOR).
- **Editar:** datos y rol; la contraseña solo cambia si la completa.
- **Desactivar:** el usuario queda inhabilitado para ingresar (no se borra el historial).

> Solo el ADMINISTRADOR puede administrar usuarios.

---

## 6. Configuración

Menú **Configuración**. Define el comportamiento del sistema.

![Configuración](img/admin/07-configuracion.png)

**Correos al dueño:**
- **Instantáneo:** un correo por cada atención registrada.
- **Resumen cada 5:** correo cada 5 atenciones de un colaborador.
- **Resumen diario (9 pm):** consolidado del día con Excel adjunto.

**Parámetros operativos:**
- **Plazo de reevaluación SBS** (días) — cuándo se puede volver a evaluar un OBSERVADO.
- **Máximo de intentos “No contestó”** — al superarlo el caso se descarta (ILOCALIZABLE).
- **Regla de reintento** escalonada para “No contestó” (ej. `+3h,+24h,+48h,+72h,+120h`).
- **Días de seguimiento para “Interesado”** — al marcar Interesado, el caso queda agendado en N días hábiles (sugerencia editable por el colaborador), para no perder al cliente.
- **Hora de inicio de jornada** y **minutos de tolerancia** antes de marcar ausencia.
- **Metas** mensuales de ventas y de derivados por colaborador.

> Los correos solo se envían si la cuenta de envío está configurada; si no, el sistema funciona normal y el resumen se “salta” dejando registro.

---

## 7. Calendario laboral

Menú **Calendario**. Define los días no laborables.

![Calendario laboral](img/admin/08-calendario.png)

- Los **feriados de Perú** vienen precargados.
- Puede **agregar o quitar** días propios de la empresa.
- Domingos y feriados **no** cuentan como laborables: no se agenda en esos días ni se marca ausencia.

---

## 8. Reasignación y casos “En riesgo”

Menú **Reasignación** (o la tarjeta “En riesgo” del dashboard).

![Reasignación](img/admin/09-reasignacion.png)

Cuando un colaborador **falta** en un día laborable, sus casos activos del día/vencidos quedan **“En riesgo”** para que no se enfríen.

- Seleccione los casos y un **colaborador destino**, o use **“reasignar todo”** de un colaborador.
- Solo se mueven casos activos (SIN_GESTIONAR / EN_GESTION / EN_SEGUIMIENTO). Nunca DERIVADO / GANADO / DESCARTADO.
- Se conserva el **historial** y se registra quién reasignó, cuándo y por qué (auditoría). La atribución de una venta futura no cambia.

---

## 9. Bitácora global

Menú **Bitácora**. Todas las atenciones de todos los colaboradores.

![Bitácora](img/admin/10-bitacora.png)

- Filtros: **rango de fechas, colaborador, campaña, base, resultado, quién contestó**.
- Tabla paginada con el detalle de cada gestión.
- **Exportar a Excel** del resultado filtrado (en el export, los datos sensibles van enmascarados).

Úsela para auditoría y consultas puntuales (“ver los del día”).

---

## 10. Cerrar ventas (Por cerrar)

Menú **Por cerrar**. Cuando un colaborador marca **Derivar (ACEPTÓ)**, el caso pasa a estado **DERIVADO** y aparece aquí: **usted cierra la venta**, no el colaborador.

![Por cerrar](img/admin/11-por-cerrar.png)

Para cada caso derivado:

![Registrar venta](img/admin/12-cerrar-venta.png)

- **Registrar venta:** marca el caso como **GANADO** (venta concretada). La venta se atribuye al colaborador que derivó.
- **No cerró:** puede **reintentar** (vuelve a seguimiento con una fecha futura) o **descartar** el caso, según corresponda.

Un cliente GANADO puede volver a ser elegible más adelante (cliente recurrente): el sistema genera automáticamente un nuevo ciclo cuando corresponde, sin tocar el histórico.

---

## 11. Recomendaciones

- Cambie la contraseña por defecto del `admin` y cree usuarios nominales por persona.
- Mantenga el **calendario** actualizado con los feriados de la empresa.
- Revise a diario el **dashboard** (asistencia, “En riesgo”, “Por cerrar”).
- Use la **bitácora** para auditar y la **configuración** para ajustar plazos según resultados.

---

*Fin del Manual del Administrador.*
