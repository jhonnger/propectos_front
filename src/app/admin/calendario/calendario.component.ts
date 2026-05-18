import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService, Feriado } from '../services/admin.service';

@Component({
  selector: 'app-calendario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css',
})
export class CalendarioComponent implements OnInit {

  // ── Estado ────────────────────────────────────────────────────────────────

  feriados: Feriado[] = [];
  cargando = false;
  errorCarga: string | null = null;

  anioSeleccionado: number = new Date().getFullYear();
  readonly anios: number[] = this.buildAnios();

  displayedColumns: string[] = ['fecha', 'descripcion', 'acciones'];

  // ── Formulario de agregar ─────────────────────────────────────────────────

  formAgregar: FormGroup;
  agregando = false;
  errorAgregar: string | null = null;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.formAgregar = this.fb.group({
      fecha: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
      descripcion: ['', [Validators.required, Validators.maxLength(200)]],
    });
  }

  ngOnInit(): void {
    this.cargarFeriados();
  }

  // ── Carga ─────────────────────────────────────────────────────────────────

  cargarFeriados(): void {
    this.cargando = true;
    this.errorCarga = null;

    this.adminService.getCalendario(this.anioSeleccionado).subscribe({
      next: (items) => {
        this.feriados = items;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.cargando = false;
        this.errorCarga = err?.error?.message ?? 'Error al cargar el calendario';
        this.cdr.markForCheck();
      },
    });
  }

  onAnioChange(): void {
    this.cargarFeriados();
  }

  // ── Agregar feriado ───────────────────────────────────────────────────────

  agregarFeriado(): void {
    if (this.formAgregar.invalid) {
      this.formAgregar.markAllAsTouched();
      return;
    }

    this.errorAgregar = null;
    this.agregando = true;

    const { fecha, descripcion } = this.formAgregar.value as { fecha: string; descripcion: string };

    this.adminService.agregarFeriado(fecha, descripcion).subscribe({
      next: () => {
        this.agregando = false;
        this.formAgregar.reset();
        this.snackBar.open('Feriado agregado correctamente', 'Cerrar', { duration: 3000 });
        this.cargarFeriados();
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.agregando = false;
        this.errorAgregar = err?.error?.message ?? 'Error al agregar el feriado';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Eliminar feriado ──────────────────────────────────────────────────────

  eliminarFeriado(feriado: Feriado): void {
    if (!confirm(`Eliminar "${feriado.descripcion}" (${feriado.fecha})?`)) return;

    this.adminService.eliminarFeriado(feriado.id).subscribe({
      next: () => {
        this.snackBar.open('Feriado eliminado', 'Cerrar', { duration: 3000 });
        this.cargarFeriados();
      },
      error: (err: { error?: { message?: string } }) => {
        const msg = err?.error?.message ?? 'Error al eliminar el feriado';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildAnios(): number[] {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }

  formatFecha(iso: string): string {
    // iso = "YYYY-MM-DD"
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  get fechaCtrl() { return this.formAgregar.get('fecha'); }
  get descripcionCtrl() { return this.formAgregar.get('descripcion'); }
}
