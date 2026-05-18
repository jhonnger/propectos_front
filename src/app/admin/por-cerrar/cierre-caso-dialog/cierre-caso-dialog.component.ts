import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { AdminService, PorCerrarItem } from '../../services/admin.service';

export type CierreAccion = 'venta' | 'reintentar' | 'descartar';

export interface CierreCasoDialogData {
  item: PorCerrarItem;
}

export interface CierreCasoDialogResult {
  estadoResultante: string;
}

@Component({
  selector: 'app-cierre-caso-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
  ],
  templateUrl: './cierre-caso-dialog.component.html',
  styleUrl: './cierre-caso-dialog.component.css',
})
export class CierreCasoDialogComponent {
  readonly item: PorCerrarItem;

  accion = signal<CierreAccion>('venta');

  // Venta
  fechaElegibilidad = '';
  comentarioVenta = '';

  // Reintentar
  fechaReintentar = '';
  comentarioReintentar = '';

  // Descartar
  comentarioDescartar = '';

  loading = false;
  errorMessage = '';

  readonly today: string;

  constructor(
    private dialogRef: MatDialogRef<CierreCasoDialogComponent, CierreCasoDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: CierreCasoDialogData,
    private adminService: AdminService,
  ) {
    this.item = data.item;
    // Build today's date string in YYYY-MM-DD for min attribute
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    this.today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  get canConfirm(): boolean {
    if (this.loading) return false;
    const a = this.accion();
    if (a === 'venta') {
      return !!this.fechaElegibilidad && this.fechaElegibilidad > this.today;
    }
    if (a === 'reintentar') {
      return !!this.fechaReintentar;
    }
    // descartar — always allowed once action is selected
    return true;
  }

  setAccion(a: CierreAccion): void {
    this.accion.set(a);
    this.errorMessage = '';
  }

  confirmar(): void {
    if (!this.canConfirm) return;

    this.loading = true;
    this.errorMessage = '';

    const a = this.accion();

    if (a === 'venta') {
      this.adminService
        .registrarVenta(
          this.item.asignacionId,
          this.fechaElegibilidad,
          this.comentarioVenta || undefined,
        )
        .subscribe({
          next: (res) => {
            this.loading = false;
            this.dialogRef.close({ estadoResultante: res.estado });
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = err?.error?.message ?? 'Error al registrar la venta.';
          },
        });
      return;
    }

    if (a === 'reintentar') {
      this.adminService
        .noCerro(
          this.item.asignacionId,
          'REINTENTAR',
          this.fechaReintentar,
          this.comentarioReintentar || undefined,
        )
        .subscribe({
          next: (res) => {
            this.loading = false;
            this.dialogRef.close({ estadoResultante: res.estado });
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = err?.error?.message ?? 'Error al registrar el seguimiento.';
          },
        });
      return;
    }

    // descartar
    this.adminService
      .noCerro(
        this.item.asignacionId,
        'DESCARTAR',
        undefined,
        this.comentarioDescartar || undefined,
      )
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.dialogRef.close({ estadoResultante: res.estado });
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.error?.message ?? 'Error al descartar el caso.';
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(undefined);
  }
}
