import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, PorCerrarItem, PorCerrarResponse } from '../services/admin.service';
import {
  CierreCasoDialogComponent,
  CierreCasoDialogData,
  CierreCasoDialogResult,
} from './cierre-caso-dialog/cierre-caso-dialog.component';

@Component({
  selector: 'app-por-cerrar',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './por-cerrar.component.html',
  styleUrl: './por-cerrar.component.css',
})
export class PorCerrarComponent implements OnInit {
  loading = false;
  items: PorCerrarItem[] = [];
  total = 0;
  pagina = 1;
  tamanioPagina = 10;
  totalPaginas = 0;
  errorCarga = '';

  displayedColumns = [
    'prospecto',
    'campania',
    'telefono',
    'derivadoPor',
    'fechaDerivacion',
    'acciones',
  ];

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorCarga = '';

    this.adminService.getPorCerrar(this.pagina, this.tamanioPagina).subscribe({
      next: (res: PorCerrarResponse) => {
        this.items = res.resultados;
        this.total = res.total;
        this.totalPaginas = res.totalPaginas;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorCarga = 'No se pudo cargar la lista. Intenta nuevamente.';
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pagina = event.pageIndex + 1;
    this.tamanioPagina = event.pageSize;
    this.cargar();
  }

  esRecurrente(item: PorCerrarItem): boolean {
    return item.nroPrestamosConcretados >= 1;
  }

  abrirCierre(item: PorCerrarItem): void {
    const data: CierreCasoDialogData = { item };
    const ref = this.dialog.open<
      CierreCasoDialogComponent,
      CierreCasoDialogData,
      CierreCasoDialogResult
    >(CierreCasoDialogComponent, {
      data,
      width: '95vw',
      maxWidth: '560px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const label = this.estadoLabel(result.estadoResultante);
      this.snackBar.open(`${label} (${result.estadoResultante})`, 'Cerrar', {
        duration: 5000,
        panelClass: ['success-snackbar'],
      });
      this.cargar();
    });
  }

  private estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      GANADO: 'Venta registrada',
      EN_SEGUIMIENTO: 'Reintento programado',
      DESCARTADO: 'Caso descartado',
    };
    return map[estado] ?? 'Operacion completada';
  }
}
