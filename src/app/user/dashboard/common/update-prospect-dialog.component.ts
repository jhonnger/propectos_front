import { Component, Inject } from '@angular/core';
import {FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
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

    // Escuchar cambios en contestoLlamada
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
      
      console.log('Datos del contacto:', contactoData);
      this.dialogRef.close(contactoData);
    }
  }
}
