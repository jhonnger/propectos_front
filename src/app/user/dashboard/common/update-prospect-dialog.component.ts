import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

interface EstadoOption {
  value: string;
  label: string;
  icon: string;
  description: string;
  colorClass: string;
}

@Component({
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    CommonModule
  ],
  selector: 'app-update-prospect-dialog',
  styleUrls: ['./update-prospect-dialog.component.css'],
  templateUrl: './update-prospect-dialog.component.html',
})
export class UpdateProspectDialogComponent {
  estadoSeleccionado: string | null = null;
  comentario = '';
  fechaAgenda = '';
  horaAgenda = '';

  estadoOptions: EstadoOption[] = [
    { value: 'NO_CONTESTO', label: 'No contesto', icon: 'phone_missed', description: 'No se pudo contactar', colorClass: 'opt-no-contesto' },
    { value: 'AGENDADO', label: 'Agendado', icon: 'event', description: 'Programar nueva llamada', colorClass: 'opt-agendado' },
    { value: 'PROSPECTO', label: 'Prospecto', icon: 'star', description: 'Interesado, en evaluacion', colorClass: 'opt-prospecto' },
    { value: 'OBSERVADO', label: 'Observado', icon: 'visibility', description: 'Requiere seguimiento', colorClass: 'opt-observado' },
    { value: 'CONCRETO_PRESTAMO', label: 'Concreto', icon: 'check_circle', description: 'Prestamo concretado', colorClass: 'opt-concreto' },
    { value: 'NO_VOLVER_LLAMAR', label: 'No llamar', icon: 'block', description: 'No volver a contactar', colorClass: 'opt-no-llamar' }
  ];

  constructor(
    public dialogRef: MatDialogRef<UpdateProspectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  getInitials(): string {
    if (!this.data.name) return '?';
    return this.data.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  selectEstado(value: string): void {
    this.estadoSeleccionado = value;
    if (value !== 'AGENDADO') {
      this.fechaAgenda = '';
      this.horaAgenda = '';
    }
  }

  isTerminal(estado: string): boolean {
    return estado === 'CONCRETO_PRESTAMO' || estado === 'NO_VOLVER_LLAMAR';
  }

  get isFormValid(): boolean {
    if (!this.estadoSeleccionado) return false;
    if (this.estadoSeleccionado === 'AGENDADO' && (!this.fechaAgenda || !this.horaAgenda)) return false;
    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.isFormValid) return;

    let fechaAgendaISO: string | undefined;
    if (this.estadoSeleccionado === 'AGENDADO' && this.fechaAgenda && this.horaAgenda) {
      fechaAgendaISO = `${this.fechaAgenda}T${this.horaAgenda}:00`;
    }

    this.dialogRef.close({
      prospectoId: this.data.id,
      comentario: this.comentario,
      estadoResultado: this.estadoSeleccionado,
      fechaAgenda: fechaAgendaISO
    });
  }
}
