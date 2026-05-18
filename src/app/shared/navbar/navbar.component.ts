import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../auth/service/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ProspectoService, JornadaEstado } from '../../user/dashboard/service/prospecto.service';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  username: string | null = null;
  userRole: string | null = null;

  // ── Jornada RF-21 ──────────────────────────────────────────────────────────
  jornada: JornadaEstado | null = null;
  jornadaCargando = false;
  jornadaAccionando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private prospectoService: ProspectoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.userRole = this.authService.getRole();

    if (this.isTeleoperador()) {
      this.cargarJornada();
    }
  }

  isTeleoperador(): boolean {
    return this.userRole === 'TELEOPERADOR';
  }

  cargarJornada(): void {
    this.jornadaCargando = true;
    this.prospectoService.getJornadaHoy().subscribe({
      next: (estado) => {
        this.jornada = estado;
        this.jornadaCargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.jornadaCargando = false;
        this.cdr.markForCheck();
      },
    });
  }

  iniciarJornada(): void {
    this.jornadaAccionando = true;
    this.prospectoService.iniciarJornada().subscribe({
      next: (estado) => {
        this.jornada = estado;
        this.jornadaAccionando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.jornadaAccionando = false;
        const msg = err?.error?.message ?? 'Error al iniciar jornada';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
        this.cdr.markForCheck();
      },
    });
  }

  finalizarJornada(): void {
    this.jornadaAccionando = true;
    this.prospectoService.finalizarJornada().subscribe({
      next: (estado) => {
        this.jornada = estado;
        this.jornadaAccionando = false;
        this.cdr.markForCheck();
      },
      error: (err: { error?: { message?: string } }) => {
        this.jornadaAccionando = false;
        const msg = err?.error?.message ?? 'Error al finalizar jornada';
        this.snackBar.open(msg, 'Cerrar', { duration: 5000, panelClass: ['error-snackbar'] });
        this.cdr.markForCheck();
      },
    });
  }

  formatHora(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
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
