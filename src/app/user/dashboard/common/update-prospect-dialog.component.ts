import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    imports: [
        MatFormFieldModule,
        FormsModule
    ],
  selector: 'app-update-prospect-dialog',
  templateUrl: './update-prospect-dialog.component.html',
})
export class UpdateProspectDialogComponent {
  comment = '';

  constructor(
    public dialogRef: MatDialogRef<UpdateProspectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    console.log(`Comentario: ${this.comment}`);
    this.dialogRef.close(true); // Retorna un valor para actualizar
  }
}
