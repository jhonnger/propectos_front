import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../services/admin.service';
import { TeleoperadorProspectosDialogComponent } from './teleoperador-prospectos-dialog/teleoperador-prospectos-dialog.component';

@Component({
  selector: 'app-dashboard-admin',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit {
  loading = true;
  dashboard: any = {};
  teleoperadores: any[] = [];
  displayedColumns = ['nombre', 'totalAsignados', 'sinGestionar', 'enGestion', 'finalizados', 'concretos', 'acciones'];

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.adminService.getDashboardAdmin().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.teleoperadores = data.teleoperadores || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al cargar dashboard', 'Cerrar', { duration: 3000 });
      }
    });
  }

  exportarExcel(): void {
    this.adminService.exportarProspectos().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prospectos_reporte.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Reporte descargado', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Error al exportar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getResultadoLabel(key: string): string {
    const map: Record<string, string> = {
      'NO_CONTESTO': 'No contesto',
      'AGENDADO': 'Agendado',
      'PROSPECTO': 'Prospecto',
      'OBSERVADO': 'Observado',
      'CONCRETO_PRESTAMO': 'Concreto',
      'NO_VOLVER_LLAMAR': 'No llamar'
    };
    return map[key] || key;
  }

  getResultadoIcon(key: string): string {
    const map: Record<string, string> = {
      'NO_CONTESTO': 'phone_missed',
      'AGENDADO': 'event',
      'PROSPECTO': 'star',
      'OBSERVADO': 'visibility',
      'CONCRETO_PRESTAMO': 'check_circle',
      'NO_VOLVER_LLAMAR': 'block'
    };
    return map[key] || 'help';
  }

  getResultadoClass(key: string): string {
    const map: Record<string, string> = {
      'NO_CONTESTO': 'res-no-contesto',
      'AGENDADO': 'res-agendado',
      'PROSPECTO': 'res-prospecto',
      'OBSERVADO': 'res-observado',
      'CONCRETO_PRESTAMO': 'res-concreto',
      'NO_VOLVER_LLAMAR': 'res-no-llamar'
    };
    return map[key] || '';
  }

  getResultadoKeys(): string[] {
    return this.dashboard.porResultado ? Object.keys(this.dashboard.porResultado) : [];
  }

  verProspectos(teleoperador: any): void {
    this.dialog.open(TeleoperadorProspectosDialogComponent, {
      data: {
        userId: teleoperador.id,
        nombre: teleoperador.nombre
      },
      width: '95vw',
      maxWidth: '950px',
      maxHeight: '90vh',
      panelClass: 'teleoperador-prospectos-panel'
    });
  }
}
