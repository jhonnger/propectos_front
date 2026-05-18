import { Component, ViewChild, ElementRef } from '@angular/core';
import { AdminService, DetalleRechazo, ImportacionResult } from '../services/admin.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

@Component({
  selector: 'app-upload-excel',
  imports: [
    MatButtonModule,
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './upload-excel.component.html',
  styleUrl: './upload-excel.component.css',
})
export class UploadExcelComponent {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  isUploading = false;
  isDragOver = false;

  // Result panel state
  importResult: ImportacionResult | null = null;
  importError: string | null = null;

  constructor(private adminService: AdminService, private snackBar: MatSnackBar) {}

  // ── Drag-and-drop + file selection ────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
    input.value = '';
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
    if (!this.isValidFile(file)) {
      this.snackBar.open(
        'Por favor selecciona un archivo Excel valido (.xlsx, .xls)',
        'Cerrar',
        { duration: 3000, panelClass: ['error-snackbar'] },
      );
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      this.snackBar.open(
        `El archivo supera el limite de 10 MB (${this.formatFileSize(file.size)})`,
        'Cerrar',
        { duration: 4000, panelClass: ['error-snackbar'] },
      );
      return;
    }

    this.selectedFile = file;
    this.importResult = null;
    this.importError = null;
  }

  private isValidFile(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    return (
      validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
  }

  removeFile(): void {
    this.selectedFile = null;
    this.importResult = null;
    this.importError = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  uploadFile(): void {
    if (!this.selectedFile || this.isUploading) return;

    this.isUploading = true;
    this.importResult = null;
    this.importError = null;

    const reader = new FileReader();
    reader.onload = () => {
      const fileBase64 = reader.result?.toString().split(',')[1];
      if (!fileBase64) {
        this.isUploading = false;
        this.importError = 'No se pudo leer el archivo seleccionado.';
        return;
      }

      this.adminService.uploadExcel(fileBase64, this.selectedFile!.name).subscribe({
        next: (result: ImportacionResult) => {
          this.isUploading = false;
          this.selectedFile = null;
          this.importResult = result;
        },
        error: (err) => {
          this.isUploading = false;
          const backendMsg: string =
            err.error?.message ?? 'Error al subir el archivo. Por favor intenta nuevamente.';
          this.importError = backendMsg;
          console.error('Error al subir el archivo:', err);
        },
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }

  // ── Helpers for template ──────────────────────────────────────────────────

  get hasRechazos(): boolean {
    return (this.importResult?.detalleRechazos?.length ?? 0) > 0;
  }

  get detalleRechazos(): DetalleRechazo[] {
    return this.importResult?.detalleRechazos ?? [];
  }

  dismissResult(): void {
    this.importResult = null;
    this.importError = null;
  }
}
