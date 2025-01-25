import { Component } from '@angular/core';
import {AdminService} from '../services/admin.service';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-upload-excel',
  imports: [MatButtonModule, CommonModule],
  templateUrl: './upload-excel.component.html',
  styleUrl: './upload-excel.component.css'
})
export class UploadExcelComponent {
  selectedFile: File | null = null;
  message: string | null = null;

  constructor(private adminService: AdminService) {}

  /**
   * Manejar la selección de archivo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.message = null; // Limpiar mensajes previos
    }
  }

  /**
   * Subir el archivo al backend
   */
  uploadFile(): void {
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileBase64 = reader.result?.toString().split(',')[1]; // Obtener el contenido Base64
        if (fileBase64) {
          this.adminService.uploadExcel(fileBase64).subscribe({
            next: () => {
              this.message = 'Archivo subido con éxito.';
              this.selectedFile = null;
            },
            error: (err) => {
              console.error('Error al subir el archivo:', err);
              this.message = 'Ocurrió un error al subir el archivo.';
            },
          });
        }
      };
      reader.readAsDataURL(this.selectedFile); // Leer el archivo como DataURL
    }
  }
}
