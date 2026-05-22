import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AdminService, Banco, BancoRequest } from '../services/admin.service';

@Component({
  selector: 'app-bancos',
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  templateUrl: './bancos.component.html',
  styleUrl: './bancos.component.css',
})
export class BancosComponent implements OnInit {

  // ── Estado ────────────────────────────────────────────────────────────────

  bancos: Banco[] = [];
  cargando = false;
  errorCarga: string | null = null;

  displayedColumns: string[] = ['nombre', 'activo', 'esDefault', 'destino', 'acciones'];

  // ── Modo edición / creación ───────────────────────────────────────────────

  /** null = formulario oculto; number = edición del banco con ese id; 'nuevo' = creación */
  modoForm: number | 'nuevo' | null = null;

  form!: FormGroup;
  guardando = false;
  errorForm: string | null = null;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarBancos();
  }

  // ── Carga ─────────────────────────────────────────────────────────────────

  cargarBancos(): void {
    this.cargando = true;
    this.errorCarga = null;

    this.adminService.getBancos().subscribe({
      next: (items) => {
        this.bancos = items;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.cargando = false;
        this.errorCarga = err?.error?.message ?? 'Error al cargar los bancos';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Formulario ────────────────────────────────────────────────────────────

  abrirCrear(): void {
    this.modoForm = 'nuevo';
    this.errorForm = null;
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      activo: [true],
      esDefault: [false],
      bancoDestinoId: [null],
    });
    this.cdr.markForCheck();
  }

  abrirEditar(banco: Banco): void {
    this.modoForm = banco.id;
    this.errorForm = null;
    this.form = this.fb.group({
      nombre: [banco.nombre, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      activo: [banco.activo],
      esDefault: [banco.esDefault],
      bancoDestinoId: [banco.bancoDestinoId],
    });
    this.cdr.markForCheck();
  }

  cancelarForm(): void {
    this.modoForm = null;
    this.errorForm = null;
    this.cdr.markForCheck();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorForm = null;
    const val = this.form.value as {
      nombre: string;
      activo: boolean;
      esDefault: boolean;
      bancoDestinoId: number | null;
    };

    const body: BancoRequest = {
      nombre: val.nombre.trim(),
      activo: val.activo,
      esDefault: val.esDefault,
      bancoDestinoId: val.bancoDestinoId || null,
    };

    const op$ = this.modoForm === 'nuevo'
      ? this.adminService.crearBanco(body)
      : this.adminService.actualizarBanco(this.modoForm as number, body);

    op$.subscribe({
      next: () => {
        this.guardando = false;
        this.modoForm = null;
        const msg = this.modoForm === null ? 'Banco guardado correctamente' : 'Banco actualizado';
        this.snackBar.open('Banco guardado correctamente', 'Cerrar', { duration: 3000 });
        this.cargarBancos();
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.guardando = false;
        this.errorForm = err?.error?.message ?? 'Error al guardar el banco';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers de presentación ───────────────────────────────────────────────

  /** Lista de bancos que pueden ser destino (excluye el banco que se está editando). */
  bancosDestino(excludeId?: number): Banco[] {
    return this.bancos.filter((b) => b.activo && b.id !== excludeId);
  }

  get nombreCtrl() { return this.form?.get('nombre'); }
}
