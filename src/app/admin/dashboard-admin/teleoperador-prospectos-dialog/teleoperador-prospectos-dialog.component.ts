import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, DrillDownColaboradorItem } from '../../services/admin.service';

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
    MatTooltipModule,
  ],
  templateUrl: './teleoperador-prospectos-dialog.component.html',
  styleUrls: ['./teleoperador-prospectos-dialog.component.css'],
})
export class TeleoperadorProspectosDialogComponent implements OnInit {
  prospectos: DrillDownColaboradorItem[] = [];
  loading = true;
  errorMessage: string | null = null;
  totalProspectos = 0;
  pagina = 1;
  tamanioPagina = 10;

  displayedColumns = ['nombre', 'celular', 'campania', 'estado', 'estadoResultado', 'contactos'];

  private readonly estadoLabels: Record<string, string> = {
    SIN_GESTIONAR: 'Sin gestionar',
    EN_GESTION: 'En gestion',
    EN_SEGUIMIENTO: 'En seguimiento',
    FINALIZADO: 'Finalizado',
    DERIVADO: 'Prospecto',
    GANADO: 'Prospecto',
    DESCARTADO: 'Descartado',
  };

  private readonly estadoResultadoLabels: Record<string, string> = {
    NO_CONTESTO: 'No contesto',
    AGENDADO: 'Agendado',
    PROSPECTO: 'Interesado',
    OBSERVADO: 'Observado',
    CONCRETO_PRESTAMO: 'Concreto',
    NO_VOLVER_LLAMAR: 'No llamar',
  };

  private readonly estadoResultadoIcons: Record<string, string> = {
    NO_CONTESTO: 'phone_missed',
    AGENDADO: 'event',
    PROSPECTO: 'star',
    OBSERVADO: 'visibility',
    CONCRETO_PRESTAMO: 'check_circle',
    NO_VOLVER_LLAMAR: 'block',
  };

  constructor(
    public dialogRef: MatDialogRef<TeleoperadorProspectosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TeleoperadorProspectosData,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.cargarProspectos();
  }

  cargarProspectos(): void {
    this.loading = true;
    this.errorMessage = null;
    this.adminService.getColaboradorDrilldown(this.data.userId, this.pagina, this.tamanioPagina).subscribe({
      next: (res) => {
        this.prospectos = res.resultados;
        this.totalProspectos = res.total;
        this.loading = false;
      },
      error: (err: { message?: string }) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'Error al cargar los prospectos.';
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pagina = event.pageIndex + 1;
    this.tamanioPagina = event.pageSize;
    this.cargarProspectos();
  }

  getEstadoLabel(estado: string): string {
    return this.estadoLabels[estado] ?? estado ?? '-';
  }

  getEstadoResultadoLabel(estado: string | null): string {
    if (!estado) return '-';
    return this.estadoResultadoLabels[estado] ?? estado;
  }

  getEstadoResultadoIcon(estado: string | null): string {
    if (!estado) return 'help_outline';
    return this.estadoResultadoIcons[estado] ?? 'help_outline';
  }

  getEstadoResultadoClass(estado: string | null): string {
    const map: Record<string, string> = {
      NO_CONTESTO: 'estado-no-contesto',
      AGENDADO: 'estado-agendado',
      PROSPECTO: 'estado-prospecto',
      OBSERVADO: 'estado-observado',
      CONCRETO_PRESTAMO: 'estado-concreto',
      NO_VOLVER_LLAMAR: 'estado-no-llamar',
    };
    return estado ? (map[estado] ?? '') : '';
  }

  getEstadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      SIN_GESTIONAR: 'badge-gray',
      EN_GESTION: 'badge-blue',
      EN_SEGUIMIENTO: 'badge-blue',
      FINALIZADO: 'badge-green',
      DERIVADO: 'badge-purple',
      GANADO: 'badge-gold',
      DESCARTADO: 'badge-gray',
    };
    return map[estado] ?? 'badge-gray';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
