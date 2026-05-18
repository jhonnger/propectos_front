import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import {
  ProspectoService,
  HistorialContacto,
  ResultadoAtencion,
  SubmotivoNoContesto,
  QuienContesto,
  VerificacionSbsResponse,
} from '../service/prospecto.service';

// ── Tipos de datos para el modal ──────────────────────────────────────────────

export interface WizardDialogData {
  prospectoId: number;
  nombre: string;
  apellido: string;
  celular: string;
  documentoIdentidad: string;
  estadoActual: string | null;
}

/** Resultado que emite el dialog al cerrarse con éxito */
export interface WizardDialogResult {
  estadoNuevo: string;
  proximaLlamada: string | null;
}

// ── Estado del wizard ─────────────────────────────────────────────────────────

type PasoSbs = 'pendiente' | 'procesando' | 'apto' | 'observado';

type RamaLlamada = 'contesto' | 'no_contesto';

type RamaQuienContesto = 'titular' | 'tercero' | 'equivocado';

interface RamaNoContestoOpcion {
  label: string;
  resultado: ResultadoAtencion;
  submotivo?: SubmotivoNoContesto;
  icon: string;
}

interface RamaContestoTitularOpcion {
  label: string;
  resultado: ResultadoAtencion;
  icon: string;
  needsAgenda: boolean;
  isTerminal: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
  ],
  selector: 'app-update-prospect-dialog',
  styleUrls: ['./update-prospect-dialog.component.css'],
  templateUrl: './update-prospect-dialog.component.html',
})
export class UpdateProspectDialogComponent implements OnInit, OnDestroy {

  // ── Apertura / cronómetro ─────────────────────────────────────────────────
  aperturaId: number | null = null;
  t0: number = Date.now();
  cronometroDisplay = '00:00';
  private cronTimer: ReturnType<typeof setInterval> | null = null;
  aperturaPendiente = true; // mientras llama a /apertura

  // ── Historial ─────────────────────────────────────────────────────────────
  historial: HistorialContacto[] = [];
  cargandoHistorial = true;
  historialError = false;

  // ── Paso 0: SBS ───────────────────────────────────────────────────────────
  pasoSbs: PasoSbs = 'pendiente';
  sbsFechaReevaluacion = '';
  sbsComentario = '';
  sbsProcesando = false;
  sbsError: string | null = null;
  sbsObservadoMensaje: string | null = null;

  // ── Paso 1: Contestó / No contestó ───────────────────────────────────────
  ramaLlamada: RamaLlamada | null = null;

  // ── Paso 2 - Rama NO contestó ─────────────────────────────────────────────
  readonly ramaNoContestoOpciones: RamaNoContestoOpcion[] = [
    { label: 'No contesta',       resultado: 'NO_CONTESTO',    submotivo: 'NO_CONTESTA', icon: 'phone_missed' },
    { label: 'Buzón de voz',      resultado: 'NO_CONTESTO',    submotivo: 'BUZON',       icon: 'voicemail'    },
    { label: 'Ocupado',           resultado: 'NO_CONTESTO',    submotivo: 'OCUPADO',     icon: 'phone_locked' },
    { label: 'Apagado',           resultado: 'NO_CONTESTO',    submotivo: 'APAGADO',     icon: 'phone_disabled' },
    { label: 'Número equivocado', resultado: 'DATOS_INVALIDOS', icon: 'wrong_location'   },
  ];
  noContestoOpcionSeleccionada: RamaNoContestoOpcion | null = null;

  // ── Paso 2 - Rama SÍ contestó: Quién ─────────────────────────────────────
  quienContestoSeleccionado: RamaQuienContesto | null = null;

  // ── Paso 3 - Titular: qué resultado ──────────────────────────────────────
  readonly titularOpciones: RamaContestoTitularOpcion[] = [
    { label: 'Interesado',         resultado: 'INTERESADO',       icon: 'star',          needsAgenda: false, isTerminal: false },
    { label: 'Agendar cita',       resultado: 'AGENDADO',         icon: 'event',         needsAgenda: true,  isTerminal: false },
    { label: 'Llamar después',     resultado: 'VOLVER_LLAMAR',    icon: 'schedule',      needsAgenda: true,  isTerminal: false },
    { label: 'Derivar (ACEPTÓ)',   resultado: 'DERIVADO',         icon: 'forward',       needsAgenda: false, isTerminal: true  },
    { label: 'No volver a llamar', resultado: 'NO_VOLVER_LLAMAR', icon: 'block',         needsAgenda: false, isTerminal: true  },
  ];
  titularOpcionSeleccionada: RamaContestoTitularOpcion | null = null;

  // ── Datos comunes ─────────────────────────────────────────────────────────
  fechaAgenda = '';
  horaAgenda = '';
  comentario = '';

  // ── Estado de envío ───────────────────────────────────────────────────────
  enviando = false;
  errorEnvio: string | null = null;

  // ── Cierre controlado ─────────────────────────────────────────────────────
  /** true después de confirmar → no llamar cerrarApertura */
  registroConfirmado = false;

  /** Mínimo para el date input de agenda (hoy en formato YYYY-MM-DD) */
  readonly today = new Date().toISOString().split('T')[0];

  constructor(
    public dialogRef: MatDialogRef<UpdateProspectDialogComponent, WizardDialogResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: WizardDialogData,
    private prospectoService: ProspectoService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // El cronómetro mide tiempo transcurrido desde que se abre el modal (D1).
    // Es solo UX: se usa el reloj LOCAL del navegador. No derivar de
    // resp.inicio (LocalDateTime sin zona del server en UTC → desfase). El
    // backend recalcula la duración autoritativa desde AperturaEvento.
    this.t0 = Date.now();
    // 1. Llamar apertura
    this.prospectoService.abrirModal(this.data.prospectoId).subscribe({
      next: (resp) => {
        this.aperturaId = resp.aperturaId;
        this.aperturaPendiente = false;
        this.iniciarCronometro();
        this.cdr.markForCheck();
      },
      error: () => {
        // Si apertura falla, igual permitir operar (best-effort)
        this.t0 = Date.now();
        this.aperturaPendiente = false;
        this.iniciarCronometro();
        this.cdr.markForCheck();
      },
    });

    // 2. Cargar historial
    this.prospectoService.getHistorialWizard(this.data.prospectoId).subscribe({
      next: (data) => {
        this.historial = data;
        this.cargandoHistorial = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.historialError = true;
        this.cargandoHistorial = false;
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    this.detenerCronometro();
  }

  // ── Cronómetro ────────────────────────────────────────────────────────────

  private iniciarCronometro(): void {
    this.cronTimer = setInterval(() => {
      const secs = Math.floor((Date.now() - this.t0) / 1000);
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      this.cronometroDisplay = `${m}:${s}`;
      this.cdr.markForCheck();
    }, 1000);
  }

  private detenerCronometro(): void {
    if (this.cronTimer !== null) {
      clearInterval(this.cronTimer);
      this.cronTimer = null;
    }
  }

  get duracionSegundos(): number {
    return Math.floor((Date.now() - this.t0) / 1000);
  }

  // ── Paso 0: SBS ───────────────────────────────────────────────────────────

  get sbsCompleto(): boolean {
    return this.pasoSbs === 'apto';
  }

  registrarSbs(resultado: 'APTO' | 'OBSERVADO'): void {
    if (this.sbsProcesando) return;
    this.sbsProcesando = true;
    this.sbsError = null;

    const payload = {
      prospectoId: this.data.prospectoId,
      resultado,
      ...(resultado === 'OBSERVADO' && this.sbsFechaReevaluacion
        ? { fechaReevaluacion: this.sbsFechaReevaluacion }
        : {}),
      ...(this.sbsComentario.trim()
        ? { comentario: this.sbsComentario.trim() }
        : {}),
    };

    this.prospectoService.verificarSbs(payload).subscribe({
      next: (resp: VerificacionSbsResponse) => {
        this.sbsProcesando = false;
        if (resp.continuar) {
          this.pasoSbs = 'apto';
        } else {
          this.pasoSbs = 'observado';
          const fechaStr = (resp as { continuar: false; fechaReevaluacionSbs: string }).fechaReevaluacionSbs;
          this.sbsObservadoMensaje =
            `Prospecto observado. Reprogramado para ${fechaStr ?? 'fecha por defecto'}.`;
          // Cerrar tras un breve delay para que el usuario lea el mensaje
          setTimeout(() => {
            this.registroConfirmado = true; // no llamar cerrarApertura
            this.dialogRef.close(null);
          }, 2500);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.sbsProcesando = false;
        this.sbsError =
          err?.error?.message ??
          err?.error?.mensaje ??
          'Error al verificar SBS. Intenta de nuevo.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Paso 1 ────────────────────────────────────────────────────────────────

  seleccionarRama(rama: RamaLlamada): void {
    this.ramaLlamada = rama;
    this.quienContestoSeleccionado = null;
    this.noContestoOpcionSeleccionada = null;
    this.titularOpcionSeleccionada = null;
    this.fechaAgenda = '';
    this.horaAgenda = '';
    this.errorEnvio = null;
  }

  // ── Paso 2 No contestó ───────────────────────────────────────────────────

  seleccionarNoContestoOpcion(opcion: RamaNoContestoOpcion): void {
    this.noContestoOpcionSeleccionada = opcion;
    this.errorEnvio = null;
  }

  // ── Paso 2/3 Sí contestó ─────────────────────────────────────────────────

  seleccionarQuienContesto(quien: RamaQuienContesto): void {
    this.quienContestoSeleccionado = quien;
    this.titularOpcionSeleccionada = null;
    this.fechaAgenda = '';
    this.horaAgenda = '';
    this.errorEnvio = null;
  }

  seleccionarTitularOpcion(opcion: RamaContestoTitularOpcion): void {
    this.titularOpcionSeleccionada = opcion;
    if (!opcion.needsAgenda) {
      this.fechaAgenda = '';
      this.horaAgenda = '';
    }
    this.errorEnvio = null;
  }

  // ── Validación del formulario ─────────────────────────────────────────────

  get puedeConfirmar(): boolean {
    if (!this.sbsCompleto) return false;
    if (this.enviando) return false;

    if (this.ramaLlamada === 'no_contesto') {
      return this.noContestoOpcionSeleccionada !== null;
    }

    if (this.ramaLlamada === 'contesto') {
      if (this.quienContestoSeleccionado === 'equivocado') return true;
      if (this.quienContestoSeleccionado === 'tercero') return true; // se registra VOLVER_LLAMAR o DATOS_INVALIDOS
      if (this.quienContestoSeleccionado === 'titular') {
        if (!this.titularOpcionSeleccionada) return false;
        if (this.titularOpcionSeleccionada.needsAgenda) {
          return !!(
            this.fechaAgenda &&
            this.horaAgenda &&
            this.fechaAgendaEsFutura() &&
            !this.fechaAgendaEsDomingo()
          );
        }
        return true;
      }
    }

    return false;
  }

  fechaAgendaEsFutura(): boolean {
    if (!this.fechaAgenda || !this.horaAgenda) return false;
    const fecha = new Date(`${this.fechaAgenda}T${this.horaAgenda}`);
    return fecha > new Date();
  }

  /** Devuelve true si la fecha seleccionada cae en domingo (getDay() === 0). */
  fechaAgendaEsDomingo(): boolean {
    if (!this.fechaAgenda) return false;
    // Parsear como fecha local (YYYY-MM-DD) sin conversión de zona horaria
    const [year, month, day] = this.fechaAgenda.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return fecha.getDay() === 0;
  }

  get agendaRequerida(): boolean {
    if (this.ramaLlamada === 'contesto' && this.quienContestoSeleccionado === 'titular') {
      return this.titularOpcionSeleccionada?.needsAgenda ?? false;
    }
    return false;
  }

  // ── Construir payload ─────────────────────────────────────────────────────

  private buildPayload(): {
    resultado: ResultadoAtencion;
    submotivoNoContesto?: SubmotivoNoContesto;
    quienContesto?: QuienContesto;
    fechaAgenda?: string;
  } | null {
    if (this.ramaLlamada === 'no_contesto' && this.noContestoOpcionSeleccionada) {
      return {
        resultado: this.noContestoOpcionSeleccionada.resultado,
        submotivoNoContesto: this.noContestoOpcionSeleccionada.submotivo,
        quienContesto: undefined,
        fechaAgenda: undefined,
      };
    }

    if (this.ramaLlamada === 'contesto') {
      // Número equivocado (quien contestó)
      if (this.quienContestoSeleccionado === 'equivocado') {
        return { resultado: 'DATOS_INVALIDOS', quienContesto: 'EQUIVOCADO' };
      }

      // Tercero
      if (this.quienContestoSeleccionado === 'tercero') {
        // Tercero siempre es VOLVER_LLAMAR en este flujo simplificado
        const fechaISO = this.fechaAgenda && this.horaAgenda
          ? `${this.fechaAgenda}T${this.horaAgenda}`
          : undefined;
        return {
          resultado: 'VOLVER_LLAMAR',
          quienContesto: 'TERCERO',
          fechaAgenda: fechaISO,
        };
      }

      // Titular
      if (this.quienContestoSeleccionado === 'titular' && this.titularOpcionSeleccionada) {
        const fechaISO = this.titularOpcionSeleccionada.needsAgenda
          ? `${this.fechaAgenda}T${this.horaAgenda}`
          : undefined;
        return {
          resultado: this.titularOpcionSeleccionada.resultado,
          quienContesto: 'TITULAR',
          fechaAgenda: fechaISO,
        };
      }
    }

    return null;
  }

  // ── Confirmar ─────────────────────────────────────────────────────────────

  onConfirmar(): void {
    if (!this.puedeConfirmar || !this.aperturaId) return;

    const partes = this.buildPayload();
    if (!partes) return;

    this.enviando = true;
    this.errorEnvio = null;
    this.cdr.markForCheck();

    const payload = {
      prospectoId: this.data.prospectoId,
      aperturaId: this.aperturaId,
      resultado: partes.resultado,
      submotivoNoContesto: partes.submotivoNoContesto,
      quienContesto: partes.quienContesto,
      fechaAgenda: partes.fechaAgenda,
      comentario: this.comentario.trim() || undefined,
      duracionGestionSegundos: this.duracionSegundos,
    };

    this.prospectoService.registrarAtencion(payload).subscribe({
      next: (resp) => {
        this.registroConfirmado = true;
        this.detenerCronometro();
        this.dialogRef.close({
          estadoNuevo: resp.estado,
          proximaLlamada: resp.proximaLlamada,
        });
      },
      error: (err) => {
        this.enviando = false;
        this.errorEnvio =
          err?.error?.message ??
          err?.error?.mensaje ??
          'Error al registrar la atención. Intenta de nuevo.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Cancelar / Cerrar ─────────────────────────────────────────────────────

  onCerrar(): void {
    if (!this.registroConfirmado && this.aperturaId !== null) {
      // Best-effort: no bloquear el cierre aunque falle
      this.prospectoService.cerrarApertura(this.aperturaId).subscribe({
        error: () => { /* ignorar errores de cierre */ },
      });
    }
    this.detenerCronometro();
    this.dialogRef.close(null);
  }

  // ── Helpers de presentación ───────────────────────────────────────────────

  getInitials(): string {
    const n = (this.data.nombre?.charAt(0) ?? '').toUpperCase();
    const a = (this.data.apellido?.charAt(0) ?? '').toUpperCase();
    return `${n}${a}` || '?';
  }

  getResultadoLabel(resultado: string | null): string {
    const map: Record<string, string> = {
      NO_CONTESTO:     'No contestó',
      DATOS_INVALIDOS: 'Datos inválidos',
      INTERESADO:      'Interesado',
      AGENDADO:        'Agendado',
      VOLVER_LLAMAR:   'Volver a llamar',
      DERIVADO:        'Derivado',
      NO_VOLVER_LLAMAR:'No llamar',
    };
    return resultado ? (map[resultado] ?? resultado) : '-';
  }

  getResultadoIcon(resultado: string | null): string {
    const map: Record<string, string> = {
      NO_CONTESTO:     'phone_missed',
      DATOS_INVALIDOS: 'wrong_location',
      INTERESADO:      'star',
      AGENDADO:        'event',
      VOLVER_LLAMAR:   'schedule',
      DERIVADO:        'forward',
      NO_VOLVER_LLAMAR:'block',
    };
    return resultado ? (map[resultado] ?? 'help_outline') : 'help_outline';
  }

  getResultadoClass(resultado: string | null): string {
    const map: Record<string, string> = {
      NO_CONTESTO:     'hist-no-contesto',
      DATOS_INVALIDOS: 'hist-datos-invalidos',
      INTERESADO:      'hist-interesado',
      AGENDADO:        'hist-agendado',
      VOLVER_LLAMAR:   'hist-volver-llamar',
      DERIVADO:        'hist-derivado',
      NO_VOLVER_LLAMAR:'hist-no-llamar',
    };
    return resultado ? (map[resultado] ?? '') : '';
  }

  formatDuracion(secs: number | null): string {
    if (!secs) return '-';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
}
