import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import {
  AdminService,
  EnRiesgoItem,
  EnRiesgoResponse,
  ReasignacionResponse,
  UsuarioDTO,
} from '../services/admin.service';

@Component({
  selector: 'app-reasignacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatTooltipModule,
  ],
  templateUrl: './reasignacion.component.html',
  styleUrl: './reasignacion.component.css',
})
export class ReasignacionComponent implements OnInit {

  // ── En riesgo ─────────────────────────────────────────────────────────────

  cargando = false;
  errorCarga: string | null = null;
  items: EnRiesgoItem[] = [];
  total = 0;
  notaVacia: string | null = null;

  displayedColumns: string[] = [
    'select',
    'nombre',
    'celular',
    'campania',
    'estado',
    'fechaAgenda',
    'colaboradorAusente',
  ];

  selection = new SelectionModel<EnRiesgoItem>(true, []);

  // ── Colaboradores destino ─────────────────────────────────────────────────

  colaboradores: UsuarioDTO[] = [];
  cargandoColaboradores = false;

  // ── Reasignación de seleccionados ─────────────────────────────────────────

  destinoId: number | null = null;
  motivo = '';
  reasignando = false;
  errorReasignacion: string | null = null;

  // ── Reasignación de todo un colaborador ──────────────────────────────────

  origenId: number | null = null;
  destinoTodoId: number | null = null;
  motivoTodo = '';
  reasignandoTodo = false;
  errorReasignacionTodo: string | null = null;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ── Carga ─────────────────────────────────────────────────────────────────

  cargarDatos(): void {
    this.cargarEnRiesgo();
    this.cargarColaboradores();
  }

  cargarEnRiesgo(): void {
    this.cargando = true;
    this.errorCarga = null;
    this.selection.clear();

    this.adminService.getEnRiesgo().subscribe({
      next: (res: EnRiesgoResponse) => {
        this.items = res.resultados;
        this.total = res.total;
        this.notaVacia = (res.total === 0 && res.nota) ? res.nota : null;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.cargando = false;
        this.errorCarga = err?.error?.message ?? 'No se pudo cargar la lista de prospectos en riesgo.';
        this.cdr.markForCheck();
      },
    });
  }

  cargarColaboradores(): void {
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

  // ── Selección de filas ────────────────────────────────────────────────────

  isAllSelected(): boolean {
    return this.selection.selected.length === this.items.length && this.items.length > 0;
  }

  isIndeterminate(): boolean {
    return this.selection.selected.length > 0 && !this.isAllSelected();
  }

  toggleAll(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.items.forEach((item) => this.selection.select(item));
    }
  }

  // ── Reasignar seleccionados ───────────────────────────────────────────────

  get puedeReasignar(): boolean {
    return this.selection.selected.length > 0 && this.destinoId !== null;
  }

  reasignarSeleccionados(): void {
    if (!this.puedeReasignar || this.destinoId === null) return;

    const ids = this.selection.selected.map((item) => item.asignacionId);
    this.reasignando = true;
    this.errorReasignacion = null;

    this.adminService.reasignar(ids, this.destinoId, this.motivo).subscribe({
      next: (res: ReasignacionResponse) => {
        this.reasignando = false;
        this.snackBar.open(
          `${res.reasignados} reasignado(s) a ${res.destinoNombre}`,
          'Cerrar',
          { duration: 5000, panelClass: ['success-snackbar'] },
        );
        this.destinoId = null;
        this.motivo = '';
        this.cargarEnRiesgo();
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.reasignando = false;
        this.errorReasignacion = err?.error?.message ?? 'Error al reasignar. Intenta nuevamente.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Reasignar todo de un colaborador ─────────────────────────────────────

  get puedeReasignarTodo(): boolean {
    return this.origenId !== null && this.destinoTodoId !== null && this.origenId !== this.destinoTodoId;
  }

  reasignarTodo(): void {
    if (!this.puedeReasignarTodo || this.origenId === null || this.destinoTodoId === null) return;

    this.reasignandoTodo = true;
    this.errorReasignacionTodo = null;

    this.adminService.reasignarTodoColaborador(this.origenId, this.destinoTodoId, this.motivoTodo).subscribe({
      next: (res: ReasignacionResponse) => {
        this.reasignandoTodo = false;
        this.snackBar.open(
          `${res.reasignados} reasignado(s) a ${res.destinoNombre}`,
          'Cerrar',
          { duration: 5000, panelClass: ['success-snackbar'] },
        );
        this.origenId = null;
        this.destinoTodoId = null;
        this.motivoTodo = '';
        this.cargarEnRiesgo();
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.reasignandoTodo = false;
        this.errorReasignacionTodo = err?.error?.message ?? 'Error al reasignar. Intenta nuevamente.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatFechaAgenda(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      SIN_GESTIONAR: 'Sin gestionar',
      EN_GESTION: 'En gestión',
      EN_SEGUIMIENTO: 'En seguimiento',
      PENDIENTE: 'Pendiente',
    };
    return map[estado] ?? estado;
  }

  colaboradorNombre(id: number): string {
    const c = this.colaboradores.find((u) => u.id === id);
    return c ? (c.nombreCompleto || `${c.nombre} ${c.apellidos}`) : `ID ${id}`;
  }
}
