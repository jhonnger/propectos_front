import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService, UsuarioDTO } from '../services/admin.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  displayedColumns: string[] = ['nombreCompleto', 'usuario', 'email', 'rolNombre', 'estado', 'acciones'];
  dataSource: MatTableDataSource<UsuarioDTO>;
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<UsuarioDTO>();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Cargar usuarios desde el backend
   */
  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsuariosActivos().subscribe({
      next: (usuarios) => {
        this.dataSource.data = usuarios;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Configurar filtro personalizado para buscar en múltiples campos
        this.dataSource.filterPredicate = (data: UsuarioDTO, filter: string) => {
          const searchStr = filter.toLowerCase();
          return data.nombreCompleto.toLowerCase().includes(searchStr) ||
                 data.usuario.toLowerCase().includes(searchStr) ||
                 data.email.toLowerCase().includes(searchStr) ||
                 data.rolNombre.toLowerCase().includes(searchStr);
        };

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.isLoading = false;
        this.snackBar.open('Error al cargar los usuarios. Por favor recarga la página.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Aplicar filtro de búsqueda
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Navegar a crear nuevo usuario
   */
  onCreateUser(): void {
    this.router.navigate(['/admin/users/new']);
  }

  /**
   * Navegar a editar usuario
   */
  onEditUser(usuario: UsuarioDTO): void {
    this.router.navigate(['/admin/users', usuario.id, 'edit']);
  }

  /**
   * Eliminar (desactivar) usuario
   */
  onDeleteUser(usuario: UsuarioDTO): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Desactivar Usuario',
        message: `¿Está seguro que desea desactivar al usuario ${usuario.nombreCompleto}?`,
        confirmText: 'Desactivar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.deleteUser(usuario.id).subscribe({
          next: (response) => {
            this.snackBar.open(response.mensaje || 'Usuario desactivado exitosamente', 'Cerrar', {
              duration: 4000,
              panelClass: ['success-snackbar']
            });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error al desactivar usuario:', error);
            let errorMessage = 'Error al desactivar el usuario. Por favor intenta nuevamente.';

            if (error.error?.mensaje) {
              errorMessage = error.error.mensaje;
            } else if (error.status === 403) {
              errorMessage = 'No tienes permisos para desactivar usuarios.';
            }

            this.snackBar.open(errorMessage, 'Cerrar', {
              duration: 6000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  /**
   * Obtener clase CSS para el chip de estado
   */
  getEstadoClass(estado: boolean): string {
    return estado ? 'estado-activo' : 'estado-inactivo';
  }

  /**
   * Obtener texto del estado
   */
  getEstadoTexto(estado: boolean): string {
    return estado ? 'Activo' : 'Inactivo';
  }
}
