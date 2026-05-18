import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AdminService,
  BitacoraFila,
  BitacoraFiltros,
  BitacoraResponse,
  UsuarioDTO,
} from '../services/admin.service';

/** Valores del enum ResultadoAtencion del backend. */
export const RESULTADO_ATENCION_VALUES: string[] = [
  'NO_CONTESTO',
  'VOLVER_LLAMAR',
  'AGENDADO',
  'INTERESADO',
  'DERIVADO',
  'NO_VOLVER_LLAMAR',
  'DATOS_INVALIDOS',
  'ILOCALIZABLE',
];

/** Labels legibles para ResultadoAtencion. */
export const RESULTADO_LABELS: Record<string, string> = {
  NO_CONTESTO: 'No contestó',
  VOLVER_LLAMAR: 'Volver a llamar',
  AGENDADO: 'Agendado',
  INTERESADO: 'Interesado',
  DERIVADO: 'Derivado',
  NO_VOLVER_LLAMAR: 'No volver a llamar',
  DATOS_INVALIDOS: 'Datos inválidos',
  ILOCALIZABLE: 'Ilocalizable',
};

/** Valores del enum QuienContesto del backend. */
export const QUIEN_CONTESTO_VALUES: string[] = ['TITULAR', 'TERCERO', 'EQUIVOCADO'];

export const QUIEN_CONTESTO_LABELS: Record<string, string> = {
  TITULAR: 'Titular',
  TERCERO: 'Tercero',
  EQUIVOCADO: 'Equivocado',
};

@Component({
  selector: 'app-bitacora',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './bitacora.component.html',
  styleUrl: './bitacora.component.css',
})
export class BitacoraComponent implements OnInit {

  // ── Estado de datos ─────────────────────────────────────────────────────────

  cargando = false;
  errorCarga: string | null = null;
  filas: BitacoraFila[] = [];
  total = 0;
  totalPaginas = 0;

  // ── Paginación ──────────────────────────────────────────────────────────────

  pagina = 1;
  tamano = 25;
  pageSizeOptions = [25, 50, 100];

  // ── Filtros ─────────────────────────────────────────────────────────────────

  desdeDate: Date | null = null;
  hastaDate: Date | null = null;
  filtroColaboradorId: number | null = null;
  filtroCampania = '';
  filtroResultado = '';
  filtroQuienContesto = '';

  // ── Colaboradores (dropdown) ─────────────────────────────────────────────────

  colaboradores: UsuarioDTO[] = [];
  cargandoColaboradores = false;

  // ── Export ──────────────────────────────────────────────────────────────────

  exportando = false;

  // ── Tabla ───────────────────────────────────────────────────────────────────

  displayedColumns: string[] = [
    'fecha',
    'colaborador',
    'prospecto',
    'celular',
    'campania',
    'base',
    'resultado',
    'quienContesto',
    'sbs',
    'duracion',
    'comentario',
  ];

  readonly resultadoValues = RESULTADO_ATENCION_VALUES;
  readonly resultadoLabels = RESULTADO_LABELS;
  readonly quienContesoValues = QUIEN_CONTESTO_VALUES;
  readonly quienContesoLabels = QUIEN_CONTESTO_LABELS;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarColaboradores();
    this.buscar();
  }

  // ── Acciones del usuario ─────────────────────────────────────────────────────

  buscar(): void {
    this.pagina = 1;
    this.cargar();
  }

  limpiar(): void {
    this.desdeDate = null;
    this.hastaDate = null;
    this.filtroColaboradorId = null;
    this.filtroCampania = '';
    this.filtroResultado = '';
    this.filtroQuienContesto = '';
    this.pagina = 1;
    this.cargar();
  }

  onPageChange(event: PageEvent): void {
    this.pagina = event.pageIndex + 1;
    this.tamano = event.pageSize;
    this.cargar();
  }

  exportar(): void {
    this.exportando = true;
    this.cdr.markForCheck();

    this.adminService.exportarBitacora(this.buildFiltros()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bitacora.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportando = false;
        this.snackBar.open('Reporte descargado', 'Cerrar', { duration: 3000 });
        this.cdr.markForCheck();
      },
      error: () => {
        this.exportando = false;
        this.snackBar.open('Error al exportar la bitácora', 'Cerrar', { duration: 4000 });
        this.cdr.markForCheck();
      },
    });
  }

  // ── Carga interna ────────────────────────────────────────────────────────────

  private cargar(): void {
    this.cargando = true;
    this.errorCarga = null;
    this.cdr.markForCheck();

    this.adminService.getBitacora(this.buildFiltros(), this.pagina, this.tamano).subscribe({
      next: (res: BitacoraResponse) => {
        this.filas = res.resultados;
        this.total = res.total;
        this.totalPaginas = res.totalPaginas;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.cargando = false;
        this.errorCarga = err?.error?.message ?? 'No se pudo cargar la bitácora. Intenta nuevamente.';
        this.snackBar.open(this.errorCarga ?? 'Error', 'Cerrar', { duration: 6000 });
        this.cdr.markForCheck();
      },
    });
  }

  private cargarColaboradores(): void {
    this.cargandoColaboradores = true;
    this.adminService.getUsuariosNoAdministradores().subscribe({
      next: (lista: UsuarioDTO[]) => {
        this.colaboradores = lista;
        this.cargandoColaboradores = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cargandoColaboradores = false;
        this.cdr.markForCheck();
      },
    });
  }

  private buildFiltros(): BitacoraFiltros {
    return {
      desde: this.desdeDate ? this.formatDate(this.desdeDate) : undefined,
      hasta: this.hastaDate ? this.formatDate(this.hastaDate) : undefined,
      colaboradorId: this.filtroColaboradorId ?? undefined,
      campania: this.filtroCampania || undefined,
      resultado: this.filtroResultado || undefined,
      quienContesto: this.filtroQuienContesto || undefined,
    };
  }

  // ── Helpers de presentación ──────────────────────────────────────────────────

  formatFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  resultadoLabel(valor: string | null): string {
    if (!valor) return '—';
    return RESULTADO_LABELS[valor] ?? valor;
  }

  quienContesoLabel(valor: string | null): string {
    if (!valor) return '—';
    return QUIEN_CONTESTO_LABELS[valor] ?? valor;
  }

  duracionLabel(segundos: number | null): string {
    if (segundos == null) return '—';
    if (segundos < 60) return `${segundos}s`;
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
