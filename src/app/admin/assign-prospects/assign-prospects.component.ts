import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  AdminService,
  AsignacionMultiItem,
  AsignacionMultiResponse,
  AssignmentResponse,
  CargaMasivaDTO,
  UsuarioDTO,
} from '../services/admin.service';

// ── Local view model ─────────────────────────────────────────────────────────

interface MultiAsignacionRow {
  usuarioId: number | null;
  cantidad: number | null;
}

interface ExcelLoad {
  id: number;
  name: string;
  date: Date;
  assignedTo: string | null;
  prospectsCount: number;
  prospectosAsignados: number;
  prospectosSinAsignar: number;
  resumenAsignaciones: { usuarioNombreCompleto: string; cantidadAsignada: number }[];
  status: string;
  isLoading: boolean;
  usuarioAsignadoId: number | null;

  // Single-assign (legacy, kept for backward compatibility)
  selectedUserId: number | null;
  cantidad: number | null;
  showBreakdown: boolean;

  // Multi-assign panel
  showMultiPanel: boolean;
  multiRows: MultiAsignacionRow[];
  multiResult: AsignacionMultiResponse | null;
  multiError: string | null;
}

@Component({
  selector: 'app-assign-prospects',
  imports: [
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './assign-prospects.component.html',
  styleUrl: './assign-prospects.component.css',
})
export class AssignProspectsComponent implements OnInit {
  excelLoads: ExcelLoad[] = [];
  isLoadingData = false;
  users: UsuarioDTO[] = [];
  displayedColumns: string[] = [
    'name',
    'prospectsCount',
    'available',
    'status',
    'actions',
  ];
  isSaving = false;

  constructor(private snackBar: MatSnackBar, private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadCargasMasivas();
    this.loadUsuarios();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadCargasMasivas(): void {
    this.isLoadingData = true;

    this.adminService.getCargasMasivas().subscribe({
      next: (cargas: CargaMasivaDTO[]) => {
        this.isLoadingData = false;
        this.excelLoads = cargas.map((carga) => this.mapCargaToLoad(carga));
      },
      error: (error) => {
        this.isLoadingData = false;
        this.snackBar.open('Error al cargar las cargas masivas', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        console.error('Error loading cargas masivas:', error);
      },
    });
  }

  private mapCargaToLoad(carga: CargaMasivaDTO): ExcelLoad {
    return {
      id: carga.id,
      name: carga.nombrearchivo,
      date: new Date(carga.fecha),
      assignedTo: carga.usuarioAsignadoCompleto,
      prospectsCount: carga.cantidadProspectos,
      prospectosAsignados: carga.prospectosAsignados || 0,
      prospectosSinAsignar: carga.prospectosSinAsignar ?? carga.cantidadProspectos,
      resumenAsignaciones: carga.resumenAsignaciones || [],
      status: this.mapEstadoToStatus(carga.estadoAsignacion),
      isLoading: false,
      usuarioAsignadoId: carga.usuarioAsignadoId,
      selectedUserId: null,
      cantidad: null,
      showBreakdown: false,
      showMultiPanel: false,
      multiRows: [{ usuarioId: null, cantidad: null }],
      multiResult: null,
      multiError: null,
    };
  }

  loadUsuarios(): void {
    this.adminService.getUsuariosNoAdministradores().subscribe({
      next: (usuarios: UsuarioDTO[]) => {
        this.users = usuarios;
      },
      error: (error) => {
        this.snackBar.open('Error al cargar los usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        console.error('Error loading users:', error);
      },
    });
  }

  refreshData(): void {
    this.isSaving = true;

    this.adminService.getCargasMasivas().subscribe({
      next: (cargas: CargaMasivaDTO[]) => {
        this.isSaving = false;
        this.excelLoads = cargas.map((carga) => this.mapCargaToLoad(carga));
        this.snackBar.open('Datos actualizados correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      },
      error: (error) => {
        this.isSaving = false;
        this.snackBar.open('Error al actualizar los datos', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        console.error('Error refreshing data:', error);
      },
    });
  }

  // ── Single assignment (legacy, kept for backward compat) ─────────────────

  assignPartial(load: ExcelLoad): void {
    if (!load.selectedUserId) {
      this.snackBar.open('Selecciona un teleoperador', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    if (load.prospectosSinAsignar <= 0) {
      this.snackBar.open('No hay prospectos disponibles para asignar', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    if (load.cantidad !== null && load.cantidad !== undefined) {
      if (load.cantidad <= 0) {
        this.snackBar.open('La cantidad debe ser mayor a 0', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        return;
      }
      if (load.cantidad > load.prospectosSinAsignar) {
        this.snackBar.open(
          `La cantidad no puede exceder los ${load.prospectosSinAsignar} disponibles`,
          'Cerrar',
          { duration: 3000, panelClass: ['error-snackbar'] },
        );
        return;
      }
    }

    const usuario = this.users.find((u) => u.id === load.selectedUserId);
    if (!usuario) {
      this.snackBar.open('Usuario no valido', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    load.isLoading = true;

    this.adminService
      .assignMassiveLoadToUser(load.id, load.selectedUserId, load.cantidad || undefined)
      .subscribe({
        next: (response: AssignmentResponse) => {
          load.isLoading = false;
          const message = `Asignacion exitosa: ${response.nuevasAsignaciones} prospectos asignados a ${response.usuarioNombre}`;
          this.snackBar.open(message, 'Cerrar', {
            duration: 5000,
            panelClass: ['success-snackbar'],
          });
          load.selectedUserId = null;
          load.cantidad = null;
          this.loadCargasMasivas();
        },
        error: (error) => {
          load.isLoading = false;
          const errorMessage = error.error?.error || 'Error al realizar la asignacion';
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          console.error('Error en asignacion:', error);
        },
      });
  }

  // ── Multi-assign panel ────────────────────────────────────────────────────

  openMultiPanel(load: ExcelLoad): void {
    load.showMultiPanel = true;
    load.multiRows = [{ usuarioId: null, cantidad: null }];
    load.multiResult = null;
    load.multiError = null;
  }

  closeMultiPanel(load: ExcelLoad): void {
    load.showMultiPanel = false;
    load.multiResult = null;
    load.multiError = null;
  }

  addMultiRow(load: ExcelLoad): void {
    load.multiRows = [...load.multiRows, { usuarioId: null, cantidad: null }];
  }

  removeMultiRow(load: ExcelLoad, index: number): void {
    if (load.multiRows.length <= 1) return;
    load.multiRows = load.multiRows.filter((_, i) => i !== index);
  }

  /** Sum of all cantidad values in the multi-row list */
  getMultiTotal(load: ExcelLoad): number {
    return load.multiRows.reduce((sum, row) => sum + (row.cantidad ?? 0), 0);
  }

  /** Remaining available after subtracting what is being distributed */
  getMultiSaldo(load: ExcelLoad): number {
    return load.prospectosSinAsignar - this.getMultiTotal(load);
  }

  /** True when the distribution is ready to submit */
  isMultiValid(load: ExcelLoad): boolean {
    const allFilled = load.multiRows.every(
      (row) => row.usuarioId !== null && row.cantidad !== null && row.cantidad > 0,
    );
    const totalOk = this.getMultiTotal(load) <= load.prospectosSinAsignar;
    return allFilled && totalOk && load.multiRows.length > 0;
  }

  confirmMultiAsign(load: ExcelLoad): void {
    if (!this.isMultiValid(load)) return;

    const asignaciones = load.multiRows
      .filter((row) => row.usuarioId !== null && row.cantidad !== null)
      .map((row) => ({ usuarioId: row.usuarioId as number, cantidad: row.cantidad as number }));

    load.isLoading = true;
    load.multiError = null;
    load.multiResult = null;

    this.adminService.asignarMulti(load.id, asignaciones).subscribe({
      next: (response: AsignacionMultiResponse) => {
        load.isLoading = false;
        load.multiResult = response;
        // Refresh the load's available count from response
        load.prospectosSinAsignar = response.saldoSinAsignar;
        load.prospectosAsignados += response.totalAsignados;
        if (load.prospectosSinAsignar === 0) {
          load.status = 'assigned';
        } else if (load.prospectosAsignados > 0) {
          load.status = 'partial';
        }
        load.multiRows = [{ usuarioId: null, cantidad: null }];
      },
      error: (error) => {
        load.isLoading = false;
        load.multiError =
          error.error?.message ?? 'Error al realizar el reparto. Intenta nuevamente.';
        console.error('Error en asignacion multi:', error);
      },
    });
  }

  dismissMultiResult(load: ExcelLoad): void {
    load.multiResult = null;
    load.multiError = null;
  }

  getMultiResultDetalle(load: ExcelLoad): AsignacionMultiItem[] {
    return load.multiResult?.detalle ?? [];
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private mapEstadoToStatus(estadoAsignacion: string): string {
    switch (estadoAsignacion) {
      case 'SIN_ASIGNAR':
        return 'pending';
      case 'ASIGNADO':
        return 'assigned';
      case 'PARCIALMENTE_ASIGNADO':
        return 'partial';
      default:
        return 'pending';
    }
  }

  getActiveUsers(): UsuarioDTO[] {
    return this.users.filter((user) => user.estado);
  }

  getSelectedUserName(userId: number | null): string {
    if (!userId) return '';
    const user = this.users.find((u) => u.id === userId);
    return user ? user.nombreCompleto : '';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      assigned: 'status-assigned',
      partial: 'status-partial',
      completed: 'status-completed',
    };
    return map[status] ?? 'status-pending';
  }

  getStatusText(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignado',
      partial: 'Parcialmente asignado',
      completed: 'Completado',
    };
    return map[status] ?? 'Pendiente';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      pending: 'pending',
      assigned: 'check_circle',
      partial: 'pie_chart',
      completed: 'check_circle',
    };
    return map[status] ?? 'pending';
  }

  toggleBreakdown(load: ExcelLoad): void {
    load.showBreakdown = !load.showBreakdown;
  }

  getPendingCount(): number {
    return this.excelLoads.filter((load) => load.status === 'pending').length;
  }

  getAssignedCount(): number {
    return this.excelLoads.filter((load) => load.status === 'assigned').length;
  }

  getPartialCount(): number {
    return this.excelLoads.filter((load) => load.status === 'partial').length;
  }

  getProgressPercent(load: ExcelLoad): number {
    if (!load.prospectsCount || load.prospectsCount === 0) return 0;
    return Math.round((load.prospectosAsignados / load.prospectsCount) * 100);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
