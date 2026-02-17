import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UpdateProspectDialogComponent } from './common/update-prospect-dialog.component';
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import { ProspectoService } from './service/prospecto.service';
import {NavbarComponent} from '../../shared/navbar/navbar.component';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatPaginatorModule,
    NavbarComponent,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  ngOnInit(): void {
    this.buscar()
  }

  callsToday = 10;
  callsThisMonth = 150;
  answeredCalls = 120;
  rejectedCalls = 30;
  totalResultados = 0;
  paginaActual = 1;
  tamanioPagina = 10;
  @ViewChild(MatPaginator) paginator!: MatPaginator;


  prospects: any[] = [

  ];

  displayedColumns: string[] = ['nombre', 'documentoIdentidad', 'campania', 'celular', 'actions'];
  dataSource = new MatTableDataSource<any>(this.prospects);

  constructor(private dialog: MatDialog,
    private prospectoService: ProspectoService
  ) {}

  siguientePagina(): void {
    this.paginaActual++;
    this.buscar();
  }
  onPageEvent(event: PageEvent): void {
    console.log('Evento de paginación:', event);
    this.paginaActual = event.pageIndex + 1;
    this.tamanioPagina = event.pageSize;

    // Lógica para cargar datos según la nueva página o tamaño
    this.buscar();
  }
  buscar(){

    const busqueda = {
      pagina: this.paginaActual,
      tamanioPagina: this.tamanioPagina,
      filtros: {
      },
    };
    this.prospectoService.getProspects(busqueda).subscribe((data) => {
      console.log(data);
      this.prospects = data.resultados;

      this.totalResultados = data.total;
      this.dataSource.data = this.prospects;
    });
  }
  openDialog(prospect: any): void {
    const dialogRef = this.dialog.open(UpdateProspectDialogComponent, {
      width: '500px',
      data: {
        id: prospect.id,
        name: `${prospect.nombre} ${prospect.apellido}`,
        phone: prospect.celular
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        console.log('Registrando contacto:', result);
        
        // Llamar al servicio para registrar el contacto
        this.prospectoService.registrarContacto(result).subscribe({
          next: (response) => {
            console.log('Contacto registrado exitosamente:', response);
            // Opcional: Recargar la lista de prospectos
            this.buscar();
          },
          error: (error) => {
            console.error('Error al registrar contacto:', error);
            // Aquí puedes mostrar un mensaje de error al usuario
          }
        });
      }
    });
  }
}
