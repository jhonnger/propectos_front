import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService, RolDTO, UpdateUsuarioRequest, UsuarioDTO } from '../../services/admin.service';

export interface UserDialogData {
  user?: UsuarioDTO;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-user-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.css'
})
export class UserDialogComponent implements OnInit {
  form!: FormGroup;
  roles: RolDTO[] = [];
  isSaving = false;
  hidePassword = true;

  // ── Tarjeta WhatsApp ──────────────────────────────────────────────────────
  /** Nombre del archivo de imagen seleccionado para la tarjeta. */
  tarjetaFileName: string | null = null;
  /** Indica que se está subiendo la imagen al backend. */
  isSavingTarjeta = false;
  /** Error de validación de tamaño en cliente (>2 MB). */
  tarjetaError: string | null = null;

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get title(): string {
    return this.isEditMode ? 'Editar Usuario' : 'Nuevo Usuario';
  }

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {}

  ngOnInit() {
    this.buildForm();
    this.loadRoles();
  }

  private buildForm() {
    const user = this.data.user;

    this.form = this.fb.group({
      nombre: [user?.nombre || '', [Validators.required, Validators.minLength(2)]],
      apellidos: [user?.apellidos || '', [Validators.required, Validators.minLength(2)]],
      usuario: [{ value: user?.usuario || '', disabled: this.isEditMode }, [Validators.required, Validators.minLength(3)]],
      password: ['', this.isEditMode ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],
      rolId: [user?.rolId || null, Validators.required],
    });
  }

  private loadRoles() {
    this.adminService.getRoles().subscribe({
      next: (roles) => this.roles = roles,
      error: (err) => console.error('Error loading roles:', err)
    });
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.form.getRawValue();

    if (this.isEditMode) {
      const updateData: UpdateUsuarioRequest = {
        nombre: formValue.nombre,
        apellidos: formValue.apellidos,
        email: '',
        rolId: formValue.rolId,
        estado: this.data.user!.estado,
      };
      if (formValue.password) {
        updateData.password = formValue.password;
      }

      this.adminService.updateUser(this.data.user!.id, updateData).subscribe({
        next: (result) => {
          this.isSaving = false;
          this.dialogRef.close(result);
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Error updating user:', err);
          this.dialogRef.close({ error: err.error?.error || 'Error al actualizar usuario' });
        }
      });
    } else {
      this.adminService.createUser(formValue).subscribe({
        next: (result) => {
          this.isSaving = false;
          this.dialogRef.close(result);
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Error creating user:', err);
          this.dialogRef.close({ error: err.error?.error || 'Error al crear usuario' });
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  // ── Tarjeta WhatsApp ──────────────────────────────────────────────────────

  /**
   * Maneja la selección de archivo para la tarjeta WhatsApp.
   * Valida tamaño (≤2 MB), lee en base64 y hace POST al backend.
   * Solo disponible en modo edición (usuario ya tiene id).
   */
  onTarjetaFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.tarjetaError = null;
    this.tarjetaFileName = null;

    // Validación de tamaño en cliente: ≤ 2 MB
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      this.tarjetaError = 'La imagen no puede superar los 2 MB.';
      input.value = '';
      return;
    }

    this.tarjetaFileName = file.name;
    const contentType = file.type;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Quitar el prefijo "data:<mime>;base64,"
      const base64 = dataUrl.split(',')[1];
      this.subirTarjeta(contentType, base64);
    };
    reader.readAsDataURL(file);

    // Limpiar el input para que el mismo archivo pueda volverse a seleccionar
    input.value = '';
  }

  private subirTarjeta(contentType: string, base64: string): void {
    const userId = this.data.user!.id;
    this.isSavingTarjeta = true;
    this.tarjetaError = null;

    this.adminService.subirTarjetaWhatsapp(userId, contentType, base64).subscribe({
      next: () => {
        this.isSavingTarjeta = false;
        this.snackBar.open('Tarjeta WhatsApp subida correctamente', 'Cerrar', {
          duration: 4000,
          panelClass: ['success-snackbar'],
        });
      },
      error: (err) => {
        this.isSavingTarjeta = false;
        this.tarjetaFileName = null;
        this.tarjetaError =
          err?.error?.message ??
          err?.message ??
          'Error al subir la tarjeta. Intenta de nuevo.';
      },
    });
  }
}
