import { Component } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-upload-excel',
  imports: [MatButtonModule, CommonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './upload-excel.component.html',
  styleUrl: './upload-excel.component.css'
})
export class UploadExcelComponent {
  selectedFile: File | null = null;
  message: string | null = null;
  isUploading: boolean = false;
  isDragOver: boolean = false;

  constructor(private adminService: AdminService, private snackBar: MatSnackBar) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    if (this.isValidFile(file)) {
      this.selectedFile = file;
      this.message = null;
    } else {
      this.snackBar.open('Por favor selecciona un archivo Excel válido (.xlsx, .xls)', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private isValidFile(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  }

  removeFile(): void {
    this.selectedFile = null;
    this.message = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  uploadFile(): void {
    if (this.selectedFile && !this.isUploading) {
      this.isUploading = true;
      this.message = null;

      const reader = new FileReader();
      reader.onload = () => {
        const fileBase64 = reader.result?.toString().split(',')[1];
        if (fileBase64) {
          this.adminService.uploadExcel(fileBase64, this.selectedFile?.name!).subscribe({
            next: () => {
              this.isUploading = false;
              this.selectedFile = null;
              this.snackBar.open('Archivo subido con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
            },
            error: (err) => {
              this.isUploading = false;
              console.error('Error al subir el archivo:', err);
              this.snackBar.open('Error al subir el archivo. Por favor intenta nuevamente.', 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            },
          });
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }
}
