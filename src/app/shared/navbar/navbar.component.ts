import { Component } from '@angular/core';
import {AuthService} from '../../auth/service/auth.service';
import {Router} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';

@Component({
  selector: 'app-navbar',
  imports: [MatMenuModule,     // Para el menú desplegable
    MatIconModule,     // Para los íconos
    MatButtonModule,],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  username: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Obtener el nombre del usuario desde el servicio de autenticación
    this.username = this.authService.getUsername();
  }

  logout(): void {
    // Lógica para cerrar sesión
    this.authService.logout();
    this.router.navigate(['/login']); // Redirigir al login
  }
}
