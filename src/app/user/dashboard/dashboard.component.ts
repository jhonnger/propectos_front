import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UpdateProspectDialogComponent } from './common/update-prospect-dialog.component';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProspectoService, MiProspecto, MisEstadisticas } from './service/prospecto.service';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
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
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  prospects: MiProspecto[] = [];
  stats: MisEstadisticas = {
    sinGestionar: 0, enGestion: 0, finalizados: 0,
    agendados: 0, noContesto: 0, prospectos: 0, concretos: 0
  };

  totalResultados = 0;
  paginaActual = 1;
  tamanioPagina = 10;
  filtroActivo: string | null = null;
  filtroEstadoResultado: string | null = null;

  displayedColumns: string[] = ['nombre', 'campania', 'celular', 'estado', 'contactos', 'actions'];
  dataSource = new MatTableDataSource<MiProspecto>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private dialog: MatDialog,
    private prospectoService: ProspectoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.buscar();
  }

  loadStats() {
    this.prospectoService.getMisEstadisticas().subscribe({
      next: (data) => this.stats = data,
      error: () => {}
    });
  }

  buscar() {
    this.prospectoService.getMisProspectos(
      this.paginaActual,
      this.tamanioPagina,
      this.filtroActivo || undefined,
      this.filtroEstadoResultado || undefined
    ).subscribe({
      next: (data) => {
        this.prospects = data.resultados;
        this.totalResultados = data.total;
        this.dataSource.data = this.prospects;
      },
      error: () => {
        this.snackBar.open('Error al cargar prospectos', 'Cerrar', { duration: 3000, panelClass: ['error-snackbar'] });
      }
    });
  }

  onPageEvent(event: PageEvent): void {
    this.paginaActual = event.pageIndex + 1;
    this.tamanioPagina = event.pageSize;
    this.buscar();
  }

  setFiltro(estado: string | null, estadoResultado: string | null) {
    this.filtroActivo = estado;
    this.filtroEstadoResultado = estadoResultado;
    this.paginaActual = 1;
    this.buscar();
  }

  isFilterActive(estado: string | null, estadoResultado: string | null): boolean {
    return this.filtroActivo === estado && this.filtroEstadoResultado === estadoResultado;
  }

  getEstadoResultadoText(estado: string | null): string {
    const map: { [key: string]: string } = {
      'NO_CONTESTO': 'No contesto',
      'AGENDADO': 'Agendado',
      'PROSPECTO': 'Prospecto',
      'OBSERVADO': 'Observado',
      'CONCRETO_PRESTAMO': 'Concreto',
      'NO_VOLVER_LLAMAR': 'No llamar'
    };
    return estado ? (map[estado] || estado) : 'Sin gestionar';
  }

  getEstadoResultadoClass(estado: string | null): string {
    const map: { [key: string]: string } = {
      'NO_CONTESTO': 'estado-no-contesto',
      'AGENDADO': 'estado-agendado',
      'PROSPECTO': 'estado-prospecto',
      'OBSERVADO': 'estado-observado',
      'CONCRETO_PRESTAMO': 'estado-concreto',
      'NO_VOLVER_LLAMAR': 'estado-no-llamar'
    };
    return estado ? (map[estado] || 'estado-sin-gestionar') : 'estado-sin-gestionar';
  }

  getEstadoResultadoIcon(estado: string | null): string {
    const map: { [key: string]: string } = {
      'NO_CONTESTO': 'phone_missed',
      'AGENDADO': 'event',
      'PROSPECTO': 'star',
      'OBSERVADO': 'visibility',
      'CONCRETO_PRESTAMO': 'check_circle',
      'NO_VOLVER_LLAMAR': 'block'
    };
    return estado ? (map[estado] || 'hourglass_empty') : 'hourglass_empty';
  }

  isFinalizado(prospect: MiProspecto): boolean {
    return prospect.estado === 'FINALIZADO';
  }

  isAgendaHoy(prospect: MiProspecto): boolean {
    if (!prospect.fechaAgenda) return false;
    const hoy = new Date().toISOString().split('T')[0];
    return prospect.fechaAgenda.startsWith(hoy);
  }

  exportarExcel(): void {
    this.prospectoService.exportarMisProspectos(
      this.filtroActivo || undefined,
      this.filtroEstadoResultado || undefined
    ).subscribe({
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
      }
    });
  }

  openDialog(prospect: MiProspecto): void {
    const dialogRef = this.dialog.open(UpdateProspectDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'custom-dialog-panel',
      data: {
        id: prospect.prospectoId,
        name: `${prospect.nombre} ${prospect.apellido}`,
        phone: prospect.celular,
        estadoActual: prospect.estadoResultado,
        isFinalizado: this.isFinalizado(prospect)
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.prospectoService.registrarContacto(result).subscribe({
          next: () => {
            this.snackBar.open('Contacto registrado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.buscar();
            this.loadStats();
          },
          error: () => {
            this.snackBar.open('Error al registrar contacto', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }
}
