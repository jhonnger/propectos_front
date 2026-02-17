import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/service/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  username: string | null = null;
  userRole: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.userRole = this.authService.getRole();
  }

  getInitials(): string {
    if (!this.username) return 'U';
    return this.username.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  getRoleLabel(): string {
    return this.userRole === 'ADMINISTRADOR' ? 'Administrador' : 'Teleoperador';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
