import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  UpdateProspectDialogComponent,
  WizardDialogData,
  WizardDialogResult,
} from './common/update-prospect-dialog.component';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  ProspectoService,
  MiProspecto,
  MisEstadisticas,
  MiActividad,
  FiltroColaborador,
  FiltroChip,
  FILTROS_COLA,
} from './service/prospecto.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/** Filtros de solo lectura: no se registran acciones de gestión */
const FILTROS_SOLO_LECTURA: FiltroColaborador[] = ['DERIVADOS', 'MIS_VENTAS', 'DESCARTADOS'];

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatPaginatorModule,
    NavbarComponent,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {

  // ── Data ──────────────────────────────────────────────────────────────────

  prospects: MiProspecto[] = [];
  stats: MisEstadisticas = {
    sinGestionar: 0,
    enGestion: 0,
    enSeguimiento: 0,
    derivados: 0,
    ganados: 0,
    descartados: 0,
  };
  actividad: MiActividad | null = null;

  // ── Estado de UI ──────────────────────────────────────────────────────────

  cargandoProspectos = false;
  cargandoActividad = false;
  errorMessage: string | null = null;

  totalResultados = 0;
  paginaActual = 1;
  tamanioPagina = 10;

  filtroActivo: FiltroColaborador = 'MI_COLA_HOY';
  busquedaTexto = '';

  readonly filtros: FiltroChip[] = FILTROS_COLA;

  displayedColumns: string[] = [
    'nombre',
    'campania',
    'estado',
    'estadoResultado',
    'fechaAgenda',
    'intentos',
    'contactos',
    'actions',
  ];
  dataSource = new MatTableDataSource<MiProspecto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly destroy$ = new Subject<void>();
  private readonly busqueda$ = new Subject<string>();

  constructor(
    private dialog: MatDialog,
    private prospectoService: ProspectoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Debounce de búsqueda ~400ms
    this.busqueda$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.paginaActual = 1;
        this.cargarProspectos();
      });

    this.loadStats();
    this.cargarProspectos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga de datos ────────────────────────────────────────────────────────

  loadStats(): void {
    this.prospectoService.getMisEstadisticas().subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.markForCheck();
      },
      error: () => {
        // Las estadísticas son no críticas; no bloquear la pantalla
      },
    });
  }

  cargarProspectos(): void {
    this.cargandoProspectos = true;
    this.errorMessage = null;

    this.prospectoService
      .getMisProspectos(
        this.filtroActivo,
        this.busquedaTexto || undefined,
        this.paginaActual,
        this.tamanioPagina,
      )
      .subscribe({
        next: (data) => {
          this.prospects = data.resultados;
          this.totalResultados = data.total;
          this.dataSource.data = this.prospects;
          this.cargandoProspectos = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.cargandoProspectos = false;
          const msg =
            err?.error?.message ??
            err?.error?.mensaje ??
            'Error al cargar prospectos';
          this.errorMessage = msg;
          this.snackBar.open(msg, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          this.cdr.markForCheck();
        },
      });
  }

  cargarActividad(): void {
    if (this.actividad) return; // ya cargada
    this.cargandoActividad = true;

    this.prospectoService.getMiActividad().subscribe({
      next: (data) => {
        this.actividad = data;
        this.cargandoActividad = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoActividad = false;
        const msg =
          err?.error?.message ?? err?.error?.mensaje ?? 'Error al cargar actividad';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['error-snackbar'] });
        this.cdr.markForCheck();
      },
    });
  }

  // ── Eventos de UI ─────────────────────────────────────────────────────────

  onFiltroChange(filtro: FiltroColaborador): void {
    this.filtroActivo = filtro;
    this.paginaActual = 1;
    this.cargarProspectos();
  }

  onBusquedaChange(texto: string): void {
    this.busquedaTexto = texto;
    this.busqueda$.next(texto);
  }

  onPageEvent(event: PageEvent): void {
    this.paginaActual = event.pageIndex + 1;
    this.tamanioPagina = event.pageSize;
    this.cargarProspectos();
  }

  onActividadTabActivated(): void {
    this.cargarActividad();
  }

  exportarExcel(): void {
    this.prospectoService.exportarMisProspectos(this.filtroActivo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mis_prospectos.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Reporte descargado', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Error al exportar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  openDialog(prospect: MiProspecto): void {
    const wizardData: WizardDialogData = {
      prospectoId: prospect.prospectoId,
      nombre: prospect.nombre,
      apellido: prospect.apellido,
      celular: prospect.celular,
      documentoIdentidad: prospect.documentoIdentidad,
      estadoActual: prospect.estadoResultado,
    };

    const dialogRef = this.dialog.open<
      UpdateProspectDialogComponent,
      WizardDialogData,
      WizardDialogResult | null
    >(UpdateProspectDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-panel',
      data: wizardData,
      disableClose: true, // el usuario debe usar Cancelar para que se llame cerrarApertura
    });

    dialogRef.afterClosed().subscribe((result: WizardDialogResult | null | undefined) => {
      if (result) {
        const estadoMsg = result.estadoNuevo
          ? `Atención registrada — nuevo estado: ${result.estadoNuevo}`
          : 'Atención registrada exitosamente';
        this.snackBar.open(estadoMsg, 'Cerrar', {
          duration: 4000,
          panelClass: ['success-snackbar'],
        });
        this.cargarProspectos();
        this.loadStats();
        // Forzar recarga de actividad en la próxima visita a esa pestaña
        this.actividad = null;
      }
    });
  }

  // ── Helpers de presentación ───────────────────────────────────────────────

  esSoloLectura(): boolean {
    return FILTROS_SOLO_LECTURA.includes(this.filtroActivo);
  }

  esClienteRecurrente(prospect: MiProspecto): boolean {
    return prospect.nroPrestamosConcretados >= 1;
  }

  getRowClass(prospect: MiProspecto): string {
    if (prospect.vencido) return 'row-vencido';
    if (prospect.futuro) return 'row-futuro';
    return '';
  }

  getEstadoLabel(estado: string | null): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      EN_SEGUIMIENTO: 'En seguimiento',
      FINALIZADO: 'Finalizado',
    };
    return estado ? (map[estado] ?? estado) : '-';
  }

  getEstadoClass(estado: string | null): string {
    const map: Record<string, string> = {
      PENDIENTE: 'chip-pendiente',
      EN_SEGUIMIENTO: 'chip-en-seguimiento',
      FINALIZADO: 'chip-finalizado',
    };
    return estado ? (map[estado] ?? 'chip-default') : 'chip-default';
  }

  getEstadoResultadoLabel(er: string | null): string {
    const map: Record<string, string> = {
      NO_CONTESTO: 'No contestó',
      AGENDADO: 'Agendado',
      PROSPECTO: 'Interesado',
      OBSERVADO: 'Observado',
      CONCRETO_PRESTAMO: 'Concreto',
      NO_VOLVER_LLAMAR: 'No llamar',
      DERIVADO: 'Derivado',
      DESCARTADO: 'Descartado',
    };
    return er ? (map[er] ?? er) : 'Sin gestionar';
  }

  getEstadoResultadoClass(er: string | null): string {
    const map: Record<string, string> = {
      NO_CONTESTO: 'er-no-contesto',
      AGENDADO: 'er-agendado',
      PROSPECTO: 'er-prospecto',
      OBSERVADO: 'er-observado',
      CONCRETO_PRESTAMO: 'er-concreto',
      NO_VOLVER_LLAMAR: 'er-no-llamar',
      DERIVADO: 'er-derivado',
      DESCARTADO: 'er-descartado',
    };
    return er ? (map[er] ?? 'er-sin-gestionar') : 'er-sin-gestionar';
  }

  getEstadoResultadoIcon(er: string | null): string {
    const map: Record<string, string> = {
      NO_CONTESTO: 'phone_missed',
      AGENDADO: 'event',
      PROSPECTO: 'star',
      OBSERVADO: 'visibility',
      CONCRETO_PRESTAMO: 'check_circle',
      NO_VOLVER_LLAMAR: 'block',
      DERIVADO: 'forward',
      DESCARTADO: 'cancel',
    };
    return er ? (map[er] ?? 'hourglass_empty') : 'hourglass_empty';
  }

  getResumenEntries(resumen: Record<string, number>): Array<{ key: string; value: number }> {
    return Object.entries(resumen).map(([key, value]) => ({ key, value }));
  }
}
