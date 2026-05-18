import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  AdminService,
  DashboardResumen,
  RankingColaborador,
  BaseResumen,
} from '../services/admin.service';
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
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
})
export class DashboardAdminComponent implements OnInit {
  loading = true;
  errorMessage: string | null = null;
  dashboard: DashboardResumen | null = null;

  rankingColumns = [
    'nombre',
    'ventasCerradas',
    'derivados',
    'atenciones',
    'contactabilidad',
    'ultimaActividad',
  ];
  basesColumns = ['nombre', 'cantidad', 'asignados', 'sinAsignar', 'avancePct'];

  /** Pasos del embudo en orden descendente para la visualizacion. */
  readonly embudoSteps: Array<{ key: keyof DashboardResumen['embudo']; label: string }> = [
    { key: 'asignados', label: 'Asignados' },
    { key: 'gestionados', label: 'Gestionados' },
    { key: 'contactadosTitular', label: 'Contactados (titular)' },
    { key: 'interesados', label: 'Interesados' },
    { key: 'derivados', label: 'Derivados' },
    { key: 'ventas', label: 'Ventas' },
  ];

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.errorMessage = null;
    this.adminService.getDashboardAdmin().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (err: { message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'Error al cargar el dashboard. Intenta de nuevo.';
      },
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
      },
    });
  }

  irAPorCerrar(): void {
    this.router.navigate(['/admin/por-cerrar']);
  }

  verDrillDown(colaborador: RankingColaborador): void {
    this.dialog.open(TeleoperadorProspectosDialogComponent, {
      data: {
        userId: colaborador.usuarioId,
        nombre: colaborador.nombre,
      },
      width: '95vw',
      maxWidth: '950px',
      maxHeight: '90vh',
      panelClass: 'teleoperador-prospectos-panel',
    });
  }

  /** Calcula el ancho de barra del embudo relativo al paso mayor (asignados). */
  embudoBarWidth(value: number): number {
    if (!this.dashboard) return 0;
    const max = this.dashboard.embudo.asignados;
    if (!max) return 0;
    return Math.round((value / max) * 100);
  }

  formatPct(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return `${(value * 100).toFixed(1)}%`;
  }

  formatColaboradores(activos: number | undefined, total: number | undefined): string {
    if (activos === undefined || total === undefined) return '—';
    return `${activos} / ${total}`;
  }

  trackBase(_: number, base: BaseResumen): number {
    return base.id;
  }

  trackRanking(_: number, row: RankingColaborador): number {
    return row.usuarioId;
  }
}
