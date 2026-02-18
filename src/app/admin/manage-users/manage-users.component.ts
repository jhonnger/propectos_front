import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, UsuarioDTO } from '../services/admin.service';
import { UserDialogComponent, UserDialogData } from './user-dialog/user-dialog.component';

@Component({
  selector: 'app-manage-users',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './manage-users.component.html',
  styleUrl: './manage-users.component.css'
})
export class ManageUsersComponent implements OnInit {
  users: UsuarioDTO[] = [];
  isLoading = false;
  displayedColumns: string[] = ['nombre', 'email', 'rol', 'estado', 'acciones'];

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getUsuariosActivos().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al cargar los usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        console.error('Error loading users:', err);
      }
    });
  }

  getActiveCount(): number {
    return this.users.filter(u => u.estado).length;
  }

  getInactiveCount(): number {
    return this.users.filter(u => !u.estado).length;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: { mode: 'create' } as UserDialogData,
      disableClose: true,
      panelClass: 'custom-dialog-panel',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.error) {
        this.snackBar.open(result.error, 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      } else {
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadUsers();
      }
    });
  }

  openEditDialog(user: UsuarioDTO) {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '650px',
      maxWidth: '95vw',
      data: { mode: 'edit', user } as UserDialogData,
      disableClose: true,
      panelClass: 'custom-dialog-panel',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.error) {
        this.snackBar.open(result.error, 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      } else {
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadUsers();
      }
    });
  }

  deleteUser(user: UsuarioDTO) {
    if (!confirm(`¿Desactivar al usuario "${user.nombreCompleto}"?`)) return;

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.snackBar.open('Usuario desactivado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadUsers();
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al desactivar usuario', 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        console.error('Error deleting user:', err);
      }
    });
  }

  eliminarUser(user: UsuarioDTO) {
    if (!confirm(`¿Eliminar permanentemente al usuario "${user.nombreCompleto}"? Esta accion no se puede deshacer.`)) return;

    this.adminService.eliminarUser(user.id).subscribe({
      next: () => {
        this.snackBar.open('Usuario eliminado permanentemente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadUsers();
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Error al eliminar usuario', 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        console.error('Error eliminating user:', err);
      }
    });
  }
}
