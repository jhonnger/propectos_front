import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {AdminService, AssignmentResponse, CargaMasivaDTO, UsuarioDTO} from '../services/admin.service';

@Component({
  selector: 'app-assign-prospects',
  imports: [
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './assign-prospects.component.html',
  styleUrl: './assign-prospects.component.css'
})
export class AssignProspectsComponent implements OnInit {
  excelLoads: any[] = [];
  isLoadingData = false;
  users: UsuarioDTO[] = [];
  displayedColumns: string[] = ['name', 'prospectsCount', 'available', 'status', 'assignedTo', 'quantity', 'actions'];
  isSaving = false;

  constructor(private snackBar: MatSnackBar, private adminService: AdminService) {}

  ngOnInit() {
    this.loadCargasMasivas();
    this.loadUsuarios();
  }

  loadCargasMasivas() {
    this.isLoadingData = true;

    this.adminService.getCargasMasivas().subscribe({
      next: (cargas: CargaMasivaDTO[]) => {
        this.isLoadingData = false;
        this.excelLoads = cargas.map(carga => ({
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
          selectedUserId: null as number | null,
          cantidad: null as number | null,
          showBreakdown: false
        }));
      },
      error: (error) => {
        this.isLoadingData = false;
        this.snackBar.open('Error al cargar las cargas masivas', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Error loading cargas masivas:', error);
      }
    });
  }

  loadUsuarios() {
    this.adminService.getUsuariosNoAdministradores().subscribe({
      next: (usuarios: UsuarioDTO[]) => {
        this.users = usuarios;
      },
      error: (error) => {
        this.snackBar.open('Error al cargar los usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Error loading users:', error);
      }
    });
  }

  private mapEstadoToStatus(estadoAsignacion: string): string {
    switch(estadoAsignacion) {
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

  getActiveUsers() {
    return this.users.filter(user => user.estado);
  }

  getSelectedUserName(userId: number | null): string {
    if (!userId) return '';
    const user = this.users.find(u => u.id === userId);
    return user ? user.nombreCompleto : '';
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'assigned': 'status-assigned',
      'partial': 'status-partial',
      'completed': 'status-completed'
    };
    return statusClasses[status] || 'status-pending';
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'assigned': 'Asignado',
      'partial': 'Parcialmente asignado',
      'completed': 'Completado'
    };
    return statusTexts[status] || 'Pendiente';
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'pending': 'pending',
      'assigned': 'check_circle',
      'partial': 'pie_chart',
      'completed': 'check_circle'
    };
    return statusIcons[status] || 'pending';
  }

  assignPartial(load: any) {
    if (!load.selectedUserId) {
      this.snackBar.open('Selecciona un teleoperador', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (load.prospectosSinAsignar <= 0) {
      this.snackBar.open('No hay prospectos disponibles para asignar', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (load.cantidad !== null && load.cantidad !== undefined) {
      if (load.cantidad <= 0) {
        this.snackBar.open('La cantidad debe ser mayor a 0', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      if (load.cantidad > load.prospectosSinAsignar) {
        this.snackBar.open(`La cantidad no puede exceder los ${load.prospectosSinAsignar} disponibles`, 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
    }

    const usuario = this.users.find(user => user.id === load.selectedUserId);
    if (!usuario) {
      this.snackBar.open('Usuario no valido', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    load.isLoading = true;

    this.adminService.assignMassiveLoadToUser(load.id, load.selectedUserId, load.cantidad || undefined).subscribe({
      next: (response: AssignmentResponse) => {
        load.isLoading = false;

        const message = `Asignacion exitosa: ${response.nuevasAsignaciones} prospectos asignados a ${response.usuarioNombre}`;
        this.snackBar.open(message, 'Cerrar', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });

        // Reset input fields
        load.selectedUserId = null;
        load.cantidad = null;

        // Reload data
        this.loadCargasMasivas();
      },
      error: (error) => {
        load.isLoading = false;

        const errorMessage = error.error?.error || 'Error al realizar la asignacion';
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });

        console.error('Error en asignacion:', error);
      }
    });
  }

  toggleBreakdown(load: any) {
    load.showBreakdown = !load.showBreakdown;
  }

  getPendingCount(): number {
    return this.excelLoads.filter(load => load.status === 'pending').length;
  }

  getAssignedCount(): number {
    return this.excelLoads.filter(load => load.status === 'assigned').length;
  }

  getPartialCount(): number {
    return this.excelLoads.filter(load => load.status === 'partial').length;
  }

  getProgressPercent(load: any): number {
    if (!load.prospectsCount || load.prospectsCount === 0) return 0;
    return Math.round((load.prospectosAsignados / load.prospectsCount) * 100);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  refreshData() {
    this.isSaving = true;

    this.adminService.getCargasMasivas().subscribe({
      next: (cargas: CargaMasivaDTO[]) => {
        this.isSaving = false;
        this.excelLoads = cargas.map(carga => ({
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
          showBreakdown: false
        }));

        this.snackBar.open('Datos actualizados correctamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.isSaving = false;
        this.snackBar.open('Error al actualizar los datos', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Error refreshing data:', error);
      }
    });
  }
}
