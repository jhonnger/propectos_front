import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
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
import {AdminService, AssignmentResponse, CargaMasivaDTO, UsuarioDTO} from '../services/admin.service';

@Component({
  selector: 'app-assign-prospects',
  imports: [
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule
  ],
  templateUrl: './assign-prospects.component.html',
  styleUrl: './assign-prospects.component.css'
})
export class AssignProspectsComponent implements OnInit {
  // Lista de cargas de Excel
  excelLoads: any[] = [];
  
  // Estado de carga de datos
  isLoadingData = false;

  // Lista de usuarios
  users: UsuarioDTO[] = [];

  // Columnas a mostrar en la tabla
  displayedColumns: string[] = ['name', 'date', 'prospectsCount', 'status', 'assignedTo', 'actions'];

  // Estado de carga
  isSaving = false;

  constructor(private snackBar: MatSnackBar, private adminService: AdminService) {}

  ngOnInit() {
    this.loadCargasMasivas();
    this.loadUsuarios();
  }

  /**
   * Cargar cargas masivas desde la API
   */
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
          status: this.mapEstadoToStatus(carga.estadoAsignacion),
          isLoading: false,
          usuarioAsignadoId: carga.usuarioAsignadoId
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

  /**
   * Cargar usuarios no administradores desde la API
   */
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

  /**
   * Mapear estado de asignación del backend al frontend
   */
  private mapEstadoToStatus(estadoAsignacion: string): string {
    switch(estadoAsignacion) {
      case 'SIN_ASIGNAR':
        return 'pending';
      case 'ASIGNADO':
        return 'assigned';
      default:
        return 'pending';
    }
  }

  /**
   * Obtener usuarios activos
   */
  getActiveUsers() {
    return this.users.filter(user => user.estado);
  }

  /**
   * Obtener clase CSS para el estado
   */
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'assigned': 'status-assigned',
      'completed': 'status-completed'
    };
    return statusClasses[status] || 'status-pending';
  }

  /**
   * Obtener texto del estado
   */
  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'Pendiente',
      'assigned': 'Asignado',
      'completed': 'Completado'
    };
    return statusTexts[status] || 'Pendiente';
  }

  /**
   * Cambiar asignación
   */
  onAssignmentChange(load: any, selectedUserId: number) {
    if (selectedUserId && selectedUserId !== load.usuarioAsignadoId) {
      // Solo realizar la asignación si realmente cambió el usuario
      this.assignLoadToUser(load, selectedUserId);
    } else {
      // Actualizar la información del usuario asignado
      const usuario = this.users.find(u => u.id === selectedUserId);
      load.assignedTo = usuario ? usuario.nombreCompleto : null;
      load.usuarioAsignadoId = selectedUserId;
      load.status = selectedUserId ? 'assigned' : 'pending';
    }
  }

  /**
   * Asignar carga masiva a usuario mediante API
   */
  private assignLoadToUser(load: any, selectedUserId: number) {
    // Encontrar el usuario seleccionado
    const usuario = this.users.find(user => user.id === selectedUserId);
    if (!usuario) {
      this.snackBar.open('Usuario no válido', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Marcar como cargando
    load.isLoading = true;
    
    // Llamar al servicio para asignar
    this.adminService.assignMassiveLoadToUser(load.id, selectedUserId).subscribe({
      next: (response: AssignmentResponse) => {
        load.isLoading = false;
        
        // Mostrar mensaje de éxito con detalles
        const message = `Asignación exitosa: ${response.nuevasAsignaciones} nuevos, ${response.reasignaciones} reasignados`;
        this.snackBar.open(message, 'Cerrar', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        console.log('Respuesta de asignación:', response);
        
        // Recargar datos para obtener la información actualizada
        this.loadCargasMasivas();
      },
      error: (error) => {
        load.isLoading = false;
        load.assignedTo = null;
        load.usuarioAsignadoId = null;
        load.status = 'pending';
        
        const errorMessage = error.error?.error || 'Error al realizar la asignación';
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        
        console.error('Error en asignación:', error);
      }
    });
  }

  /**
   * Remover asignación
   */
  removeAssignment(load: any) {
    load.assignedTo = null;
    load.usuarioAsignadoId = null;
    load.status = 'pending';
  }

  /**
   * Contar asignaciones pendientes
   */
  getPendingCount(): number {
    return this.excelLoads.filter(load => load.status === 'pending').length;
  }

  /**
   * Contar asignaciones completadas
   */
  getAssignedCount(): number {
    return this.excelLoads.filter(load => load.status === 'assigned').length;
  }

  /**
   * Guardar las asignaciones (recargar datos)
   */
  saveAssignments() {
    this.isSaving = true;
    
    // Recargar datos para obtener el estado actualizado
    this.adminService.getCargasMasivas().subscribe({
      next: (cargas: CargaMasivaDTO[]) => {
        this.isSaving = false;
        this.excelLoads = cargas.map(carga => ({
          id: carga.id,
          name: carga.nombrearchivo,
          date: new Date(carga.fecha),
          assignedTo: carga.usuarioAsignadoCompleto,
          prospectsCount: carga.cantidadProspectos,
          status: this.mapEstadoToStatus(carga.estadoAsignacion),
          isLoading: false,
          usuarioAsignadoId: carga.usuarioAsignadoId
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
