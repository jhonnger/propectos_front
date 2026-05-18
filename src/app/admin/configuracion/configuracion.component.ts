import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import {
  AdminService,
  ConfiguracionDueno,
  ConfiguracionPatch,
  EstadoEmail,
} from '../services/admin.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css',
})
export class ConfiguracionComponent implements OnInit {
  loading = true;
  saving = false;
  errorCarga: string | null = null;
  errorGuardar: string | null = null;

  estadoEmail: EstadoEmail | null = null;

  form: FormGroup;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      // Notificaciones
      toggleEmailInstantaneo: [false],
      toggleEmailDigest: [false],
      toggleResumenDiario: [false],
      // Metas
      metaVentasMensual: [0, [Validators.required, Validators.min(0)]],
      metaDerivadosPorColaborador: [0, [Validators.required, Validators.min(0)]],
      // Parámetros operativos
      plazoReevaluacionSbsDias: [90, [Validators.required, Validators.min(1)]],
      maxIntentosNoContesto: [6, [Validators.required, Validators.min(1)]],
      reglaReintentoNoContesto: ['+3h,+24h,+48h,+72h,+120h', [Validators.required]],
      horaInicioJornada: ['09:00', [Validators.required, Validators.pattern(/^\d{2}:\d{2}$/)]],
      minutosGraciaAusencia: [45, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.errorCarga = null;

    this.adminService.getConfiguracion().subscribe({
      next: (config: ConfiguracionDueno) => {
        this.form.patchValue({
          toggleEmailInstantaneo: config.toggleEmailInstantaneo,
          toggleEmailDigest: config.toggleEmailDigest,
          toggleResumenDiario: config.toggleResumenDiario,
          metaVentasMensual: config.metaVentasMensual,
          metaDerivadosPorColaborador: config.metaDerivadosPorColaborador,
          plazoReevaluacionSbsDias: config.plazoReevaluacionSbsDias,
          maxIntentosNoContesto: config.maxIntentosNoContesto,
          reglaReintentoNoContesto: config.reglaReintentoNoContesto,
          horaInicioJornada: config.horaInicioJornada,
          minutosGraciaAusencia: config.minutosGraciaAusencia,
        });
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorCarga = err?.error?.message ?? err?.message ?? 'Error al cargar la configuración.';
      },
    });

    // Carga en paralelo el estado del correo (no bloquea si falla)
    this.adminService.getEstadoEmail().subscribe({
      next: (estado: EstadoEmail) => {
        this.estadoEmail = estado;
      },
      error: () => {
        // Estado de email es informativo; no bloquea la pantalla
        this.estadoEmail = null;
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) return;

    this.saving = true;
    this.errorGuardar = null;

    const v = this.form.value as {
      toggleEmailInstantaneo: boolean;
      toggleEmailDigest: boolean;
      toggleResumenDiario: boolean;
      metaVentasMensual: number;
      metaDerivadosPorColaborador: number;
      plazoReevaluacionSbsDias: number;
      maxIntentosNoContesto: number;
      reglaReintentoNoContesto: string;
      horaInicioJornada: string;
      minutosGraciaAusencia: number;
    };

    const patch: ConfiguracionPatch = {
      toggleEmailInstantaneo: v.toggleEmailInstantaneo,
      toggleEmailDigest: v.toggleEmailDigest,
      toggleResumenDiario: v.toggleResumenDiario,
      metaVentasMensual: v.metaVentasMensual,
      metaDerivadosPorColaborador: v.metaDerivadosPorColaborador,
      plazoReevaluacionSbsDias: v.plazoReevaluacionSbsDias,
      maxIntentosNoContesto: v.maxIntentosNoContesto,
      reglaReintentoNoContesto: v.reglaReintentoNoContesto,
      horaInicioJornada: v.horaInicioJornada,
      minutosGraciaAusencia: v.minutosGraciaAusencia,
    };

    this.adminService.actualizarConfiguracion(patch).subscribe({
      next: (updated: ConfiguracionDueno) => {
        this.saving = false;
        this.form.patchValue({
          toggleEmailInstantaneo: updated.toggleEmailInstantaneo,
          toggleEmailDigest: updated.toggleEmailDigest,
          toggleResumenDiario: updated.toggleResumenDiario,
          metaVentasMensual: updated.metaVentasMensual,
          metaDerivadosPorColaborador: updated.metaDerivadosPorColaborador,
          plazoReevaluacionSbsDias: updated.plazoReevaluacionSbsDias,
          maxIntentosNoContesto: updated.maxIntentosNoContesto,
          reglaReintentoNoContesto: updated.reglaReintentoNoContesto,
          horaInicioJornada: updated.horaInicioJornada,
          minutosGraciaAusencia: updated.minutosGraciaAusencia,
        });
        this.snackBar.open('Configuración guardada', 'Cerrar', {
          duration: 4000,
          panelClass: ['success-snackbar'],
        });
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        // Mostrar el mensaje real del backend (400 validation error)
        this.errorGuardar =
          err?.error?.message ??
          err?.error?.error ??
          err?.message ??
          'Error al guardar la configuración.';
      },
    });
  }

  /** ¿Hay error de validación en el campo dado? */
  hasError(field: string, errorCode: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.touched && ctrl.hasError(errorCode));
  }
}
