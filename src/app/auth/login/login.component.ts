import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-login',
  imports: [
    CommonModule, // Directivas comunes como *ngIf y *ngFor
    ReactiveFormsModule, // Manejo de formularios reactivos
    MatFormFieldModule, // Angular Material: campos de formulario
    MatInputModule, // Angular Material: inputs
    MatButtonModule, // Angular Material: botones
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (success) => {
          console.log(' success ', success)
          if (success) {
            this.router.navigate(['/dashboard']); // Redirige después de un login exitoso
          }
        },
        error: (err) => {
          this.errorMessage = 'Credenciales incorrectas. Inténtalo de nuevo.';
          console.error(err);
        }
      });
    }
  }
}
