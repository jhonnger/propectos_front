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
import { AdminService, RolDTO, UsuarioDTO } from '../../services/admin.service';

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
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.css'
})
export class UserDialogComponent implements OnInit {
  form!: FormGroup;
  roles: RolDTO[] = [];
  isSaving = false;
  hidePassword = true;

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get title(): string {
    return this.isEditMode ? 'Editar Usuario' : 'Nuevo Usuario';
  }

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
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
      email: [user?.email || '', [Validators.required, Validators.email]],
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
      const updateData: any = {
        nombre: formValue.nombre,
        apellidos: formValue.apellidos,
        email: formValue.email,
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
}
