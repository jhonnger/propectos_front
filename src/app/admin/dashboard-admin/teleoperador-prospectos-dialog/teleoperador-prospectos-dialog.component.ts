import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, MiProspectoAdmin, ContactoHistorialAdmin } from '../../services/admin.service';

export interface TeleoperadorProspectosData {
  userId: number;
  nombre: string;
}

@Component({
  selector: 'app-teleoperador-prospectos-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './teleoperador-prospectos-dialog.component.html',
  styleUrls: ['./teleoperador-prospectos-dialog.component.css']
})
export class TeleoperadorProspectosDialogComponent implements OnInit {
  prospectos: MiProspectoAdmin[] = [];
  loading = true;
  totalProspectos = 0;
  pagina = 1;
  tamanioPagina = 10;

  displayedColumns = ['nombre', 'celular', 'campania', 'estado', 'estadoResultado', 'contactos', 'acciones'];

  expandedProspectoId: number | null = null;
  historialMap: Map<number, ContactoHistorialAdmin[]> = new Map();
  historialLoadingMap: Map<number, boolean> = new Map();

  private estadoLabels: Record<string, string> = {
    'SIN_GESTIONAR': 'Sin gestionar',
    'EN_GESTION': 'En gestion',
    'FINALIZADO': 'Finalizado'
  };

  private estadoResultadoLabels: Record<string, string> = {
    'NO_CONTESTO': 'No contesto',
    'AGENDADO': 'Agendado',
    'PROSPECTO': 'Interesado',
    'OBSERVADO': 'Observado',
    'CONCRETO_PRESTAMO': 'Concreto',
    'NO_VOLVER_LLAMAR': 'No llamar'
  };

  private estadoResultadoIcons: Record<string, string> = {
    'NO_CONTESTO': 'phone_missed',
    'AGENDADO': 'event',
    'PROSPECTO': 'star',
    'OBSERVADO': 'visibility',
    'CONCRETO_PRESTAMO': 'check_circle',
    'NO_VOLVER_LLAMAR': 'block'
  };

  private motivoLabels: Record<string, string> = {
    'CELULAR_APAGADO': 'Celular apagado',
    'VOLVER_LLAMAR': 'Volver a llamar',
    'NO_EXISTE': 'No existe',
    'FUERA_SERVICIO': 'Fuera de servicio'
  };

  constructor(
    public dialogRef: MatDialogRef<TeleoperadorProspectosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TeleoperadorProspectosData,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.cargarProspectos();
  }

  cargarProspectos(): void {
    this.loading = true;
    this.adminService.getProspectosPorUsuario(this.data.userId, this.pagina, this.tamanioPagina).subscribe({
      next: (res) => {
        this.prospectos = res.resultados;
        this.totalProspectos = res.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pagina = event.pageIndex + 1;
    this.tamanioPagina = event.pageSize;
    this.expandedProspectoId = null;
    this.cargarProspectos();
  }

  toggleHistorial(prospecto: MiProspectoAdmin): void {
    if (this.expandedProspectoId === prospecto.prospectoId) {
      this.expandedProspectoId = null;
      return;
    }

    this.expandedProspectoId = prospecto.prospectoId;

    if (!this.historialMap.has(prospecto.prospectoId)) {
      this.historialLoadingMap.set(prospecto.prospectoId, true);
      this.adminService.getHistorialContactos(prospecto.prospectoId).subscribe({
        next: (historial) => {
          this.historialMap.set(prospecto.prospectoId, historial);
          this.historialLoadingMap.set(prospecto.prospectoId, false);
        },
        error: () => {
          this.historialMap.set(prospecto.prospectoId, []);
          this.historialLoadingMap.set(prospecto.prospectoId, false);
        }
      });
    }
  }

  isExpanded(prospecto: MiProspectoAdmin): boolean {
    return this.expandedProspectoId === prospecto.prospectoId;
  }

  getEstadoLabel(estado: string): string {
    return this.estadoLabels[estado] || estado || '-';
  }

  getEstadoResultadoLabel(estado: string): string {
    return this.estadoResultadoLabels[estado] || estado || '-';
  }

  getEstadoResultadoIcon(estado: string): string {
    return this.estadoResultadoIcons[estado] || 'help_outline';
  }

  getEstadoResultadoClass(estado: string): string {
    const map: Record<string, string> = {
      'NO_CONTESTO': 'estado-no-contesto',
      'AGENDADO': 'estado-agendado',
      'PROSPECTO': 'estado-prospecto',
      'OBSERVADO': 'estado-observado',
      'CONCRETO_PRESTAMO': 'estado-concreto',
      'NO_VOLVER_LLAMAR': 'estado-no-llamar'
    };
    return map[estado] || '';
  }

  getEstadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      'SIN_GESTIONAR': 'badge-gray',
      'EN_GESTION': 'badge-blue',
      'FINALIZADO': 'badge-green'
    };
    return map[estado] || 'badge-gray';
  }

  getMotivoLabel(motivo: string): string {
    return this.motivoLabels[motivo] || motivo;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
