import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService, RolDTO, CreateUserRequest } from '../services/admin.service';

@Component({
  selector: 'app-create-user',
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
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css'
})
export class CreateUserComponent implements OnInit {
  userForm: FormGroup;
  roles: RolDTO[] = [];
  isSubmitting = false;
  isLoadingRoles = true;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private router: Router
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
          // Navegar de vuelta después de crear el usuario
          setTimeout(() => {
            this.router.navigate(['/admin']);
          }, 1500);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error al crear usuario:', error);

          let errorMessage = 'Error al crear el usuario. Por favor intenta nuevamente.';

          // Manejar errores específicos del backend
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
   * Cancelar y volver atrás
   */
  onCancel(): void {
    if (this.userForm.dirty) {
      if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
        this.router.navigate(['/admin']);
      }
    } else {
      this.router.navigate(['/admin']);
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
