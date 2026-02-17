import { Component, Inject } from '@angular/core';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {CommonModule} from '@angular/common';

export interface ContactoRegistro {
  prospectoId: number;
  comentario: string;
  contestoLlamada: boolean;
  interesado: boolean;
}

@Component({
    imports: [
      ReactiveFormsModule,
      MatFormFieldModule,
      MatDialogModule,
      MatInputModule,
      MatButtonModule,
      MatSelectModule,
      MatIconModule,
      FormsModule,
      CommonModule
    ],
  selector: 'app-update-prospect-dialog',
  styleUrls: ['./update-prospect-dialog.component.css'],
  templateUrl: './update-prospect-dialog.component.html',
})
export class UpdateProspectDialogComponent {
  contactForm: FormGroup;
  mostrarInteresado = false;

  constructor(
    public dialogRef: MatDialogRef<UpdateProspectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.contactForm = this.fb.group({
      contestoLlamada: [null, [Validators.required]],
      interesado: [null],
      comentario: ['']
    });

    this.contactForm.get('contestoLlamada')?.valueChanges.subscribe((value) => {
      this.mostrarInteresado = value === true;
      const interesadoControl = this.contactForm.get('interesado');

      if (this.mostrarInteresado) {
        interesadoControl?.setValidators([Validators.required]);
      } else {
        interesadoControl?.clearValidators();
        interesadoControl?.setValue(null);
      }
      interesadoControl?.updateValueAndValidity();
    });
  }

  getInitials(): string {
    if (!this.data.name) return '?';
    return this.data.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.contactForm.valid) {
      const contactoData: ContactoRegistro = {
        prospectoId: this.data.id,
        comentario: this.contactForm.get('comentario')?.value || '',
        contestoLlamada: this.contactForm.get('contestoLlamada')?.value,
        interesado: this.contactForm.get('interesado')?.value
      };

      this.dialogRef.close(contactoData);
    }
  }
}
