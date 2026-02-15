import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService, RolDTO, CreateUserRequest, UpdateUserRequest } from '../services/admin.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  roles: RolDTO[] = [];
  isSubmitting = false;
  isLoadingRoles = true;
  isEditMode = false;
  userId: number | null = null;
  isLoadingUser = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      usuario: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
      confirmPassword: ['', [Validators.required]],
      rolId: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    this.loadRoles();

    // Verificar si estamos en modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.userId = +params['id'];
        this.loadUserData();
      }
    });
  }

  /**
   * Cargar datos del usuario en modo edición
   */
  loadUserData(): void {
    if (!this.userId) return;

    this.isLoadingUser = true;
    this.adminService.getUserById(this.userId).subscribe({
      next: (usuario) => {
        // En modo edición, password es opcional
        this.userForm.patchValue({
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          usuario: usuario.usuario,
          email: usuario.email,
          rolId: usuario.rolId
        });

        // Hacer el campo usuario readonly en modo edición
        this.userForm.get('usuario')?.disable();

        // Hacer password opcional en modo edición
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.setValidators([Validators.minLength(6), Validators.maxLength(50)]);
        this.userForm.get('confirmPassword')?.clearValidators();

        this.isLoadingUser = false;
      },
      error: (error) => {
        console.error('Error al cargar usuario:', error);
        this.isLoadingUser = false;
        this.snackBar.open('Error al cargar los datos del usuario.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/admin/users']);
      }
    });
  }

  /**
   * Obtener el título del formulario
   */
  getFormTitle(): string {
    return this.isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario';
  }

  /**
   * Obtener el texto del botón de acción
   */
  getActionButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Actualizando...' : 'Creando...';
    }
    return this.isEditMode ? 'Actualizar Usuario' : 'Crear Usuario';
  }

  /**
   * Obtener el icono del botón de acción
   */
  getActionButtonIcon(): string {
    return this.isEditMode ? 'save' : 'person_add';
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Limpiar el error si las contraseñas coinciden
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }

    return null;
  }

  /**
   * Cargar los roles disponibles desde el backend
   */
  loadRoles(): void {
    this.isLoadingRoles = true;
    this.adminService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoadingRoles = false;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.isLoadingRoles = false;
        this.snackBar.open('Error al cargar los roles. Por favor recarga la página.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Obtener el mensaje de error para cada campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);

    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }

    if (field.errors['email']) {
      return 'Email inválido';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (field.errors['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    if (field.errors['pattern']) {
      return 'Solo letras, números y guiones bajos';
    }

    if (field.errors['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }

  /**
   * Enviar el formulario
   */
  onSubmit(): void {
    if (this.userForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      if (this.isEditMode && this.userId) {
        this.updateUser();
      } else {
        this.createUser();
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });

      this.snackBar.open('Por favor completa todos los campos correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  /**
   * Crear un nuevo usuario
   */
  private createUser(): void {
    const userData: CreateUserRequest = {
      nombre: this.userForm.value.nombre.trim(),
      apellidos: this.userForm.value.apellidos.trim(),
      usuario: this.userForm.value.usuario.trim(),
      email: this.userForm.value.email.trim().toLowerCase(),
      password: this.userForm.value.password,
      rolId: this.userForm.value.rolId
    };

    this.adminService.createUser(userData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open(response.mensaje || 'Usuario creado exitosamente', 'Cerrar', {
          duration: 4000,
          panelClass: ['success-snackbar']
        });
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error al crear usuario:', error);

        let errorMessage = 'Error al crear el usuario. Por favor intenta nuevamente.';

        if (error.error?.mensaje) {
          errorMessage = error.error.mensaje;
        } else if (error.status === 409) {
          errorMessage = 'El usuario o email ya existe en el sistema.';
        } else if (error.status === 400) {
          errorMessage = 'Datos inválidos. Verifica la información e intenta nuevamente.';
        } else if (error.status === 401 || error.status === 403) {
          errorMessage = 'No tienes permisos para crear usuarios.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 6000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Actualizar usuario existente
   */
  private updateUser(): void {
    if (!this.userId) return;

    const updateData: UpdateUserRequest = {
      nombre: this.userForm.value.nombre.trim(),
      apellidos: this.userForm.value.apellidos.trim(),
      email: this.userForm.value.email.trim().toLowerCase(),
      rolId: this.userForm.value.rolId
    };

    // Solo incluir password si se ingresó uno nuevo
    if (this.userForm.value.password && this.userForm.value.password.trim() !== '') {
      updateData.password = this.userForm.value.password;
    }

    this.adminService.updateUser(this.userId, updateData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open(response.mensaje || 'Usuario actualizado exitosamente', 'Cerrar', {
          duration: 4000,
          panelClass: ['success-snackbar']
        });
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error al actualizar usuario:', error);

        let errorMessage = 'Error al actualizar el usuario. Por favor intenta nuevamente.';

        if (error.error?.mensaje) {
          errorMessage = error.error.mensaje;
        } else if (error.status === 409) {
          errorMessage = 'El email ya existe en el sistema.';
        } else if (error.status === 400) {
          errorMessage = 'Datos inválidos. Verifica la información e intenta nuevamente.';
        } else if (error.status === 401 || error.status === 403) {
          errorMessage = 'No tienes permisos para actualizar usuarios.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 6000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Cancelar y volver atrás
   */
  onCancel(): void {
    if (this.userForm.dirty) {
      if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
        this.router.navigate(['/admin/users']);
      }
    } else {
      this.router.navigate(['/admin/users']);
    }
  }

  /**
   * Verificar si un campo tiene error y ha sido tocado
   */
  hasError(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
