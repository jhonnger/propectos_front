import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ProspectoService, ContactoHistorial } from '../service/prospecto.service';

interface SubOpcion {
  value: string;
  label: string;
  icon: string;
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
    MatTabsModule,
    MatProgressSpinnerModule,
    CommonModule
  ],
  selector: 'app-update-prospect-dialog',
  styleUrls: ['./update-prospect-dialog.component.css'],
  templateUrl: './update-prospect-dialog.component.html',
})
export class UpdateProspectDialogComponent implements OnInit {
  pasoSeleccionado: 'CONTESTO' | 'NO_CONTESTO' | null = null;
  subOpcionSeleccionada: string | null = null;
  comentario = '';
  fechaAgenda = '';
  horaAgenda = '';

  historial: ContactoHistorial[] = [];
  cargandoHistorial = true;

  contestoOptions: SubOpcion[] = [
    { value: 'AGENDADO', label: 'Agendar reunion', icon: 'event', colorClass: 'opt-agendado' },
    { value: 'PROSPECTO', label: 'Interesado', icon: 'star', colorClass: 'opt-prospecto' },
    { value: 'OBSERVADO', label: 'Observado', icon: 'visibility', colorClass: 'opt-observado' },
    { value: 'CONCRETO_PRESTAMO', label: 'Concreto', icon: 'check_circle', colorClass: 'opt-concreto' },
    { value: 'NO_VOLVER_LLAMAR', label: 'No llamar', icon: 'block', colorClass: 'opt-no-llamar' }
  ];

  noContestoOptions: SubOpcion[] = [
    { value: 'CELULAR_APAGADO', label: 'Celular apagado', icon: 'phone_disabled', colorClass: 'opt-no-contesto' },
    { value: 'VOLVER_LLAMAR', label: 'Volver a llamar', icon: 'schedule', colorClass: 'opt-agendado' },
    { value: 'NO_EXISTE', label: 'No existe', icon: 'person_off', colorClass: 'opt-no-llamar' },
    { value: 'FUERA_SERVICIO', label: 'Fuera de servicio', icon: 'signal_cellular_off', colorClass: 'opt-observado' }
  ];

  private estadoLabels: Record<string, string> = {
    'NO_CONTESTO': 'No contesto',
    'AGENDADO': 'Agendado',
    'PROSPECTO': 'Interesado',
    'OBSERVADO': 'Observado',
    'CONCRETO_PRESTAMO': 'Concreto',
    'NO_VOLVER_LLAMAR': 'No llamar'
  };

  private motivoLabels: Record<string, string> = {
    'CELULAR_APAGADO': 'Celular apagado',
    'VOLVER_LLAMAR': 'Volver a llamar',
    'NO_EXISTE': 'No existe',
    'FUERA_SERVICIO': 'Fuera de servicio'
  };

  private estadoIcons: Record<string, string> = {
    'NO_CONTESTO': 'phone_missed',
    'AGENDADO': 'event',
    'PROSPECTO': 'star',
    'OBSERVADO': 'visibility',
    'CONCRETO_PRESTAMO': 'check_circle',
    'NO_VOLVER_LLAMAR': 'block'
  };

  constructor(
    public dialogRef: MatDialogRef<UpdateProspectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private prospectoService: ProspectoService
  ) {}

  ngOnInit(): void {
    this.prospectoService.getHistorial(this.data.id).subscribe({
      next: (data) => {
        this.historial = data;
        this.cargandoHistorial = false;
      },
      error: () => {
        this.cargandoHistorial = false;
      }
    });
  }

  getEstadoLabel(estado: string): string {
    return this.estadoLabels[estado] || estado;
  }

  getMotivoLabel(motivo: string): string {
    return this.motivoLabels[motivo] || motivo;
  }

  getEstadoIcon(estado: string): string {
    return this.estadoIcons[estado] || 'help_outline';
  }

  getEstadoColorClass(estado: string): string {
    const map: Record<string, string> = {
      'NO_CONTESTO': 'estado-no-contesto',
      'AGENDADO': 'estado-agendado',
      'PROSPECTO': 'estado-prospecto',
      'OBSERVADO': 'estado-observado',
      'CONCRETO_PRESTAMO': 'estado-concreto',
      'NO_VOLVER_LLAMAR': 'estado-no-llamar'
    };
    return map[estado] || '';
  }

  getInitials(): string {
    if (!this.data.name) return '?';
    return this.data.name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  }

  selectPaso(paso: 'CONTESTO' | 'NO_CONTESTO'): void {
    this.pasoSeleccionado = paso;
    this.subOpcionSeleccionada = null;
    this.fechaAgenda = '';
    this.horaAgenda = '';
  }

  selectSubOpcion(value: string): void {
    this.subOpcionSeleccionada = value;
    if (value !== 'AGENDADO') {
      this.fechaAgenda = '';
      this.horaAgenda = '';
    }
  }

  get currentOptions(): SubOpcion[] {
    if (this.pasoSeleccionado === 'CONTESTO') return this.contestoOptions;
    if (this.pasoSeleccionado === 'NO_CONTESTO') return this.noContestoOptions;
    return [];
  }

  get estadoResultadoFinal(): string | null {
    if (!this.subOpcionSeleccionada) return null;
    if (this.pasoSeleccionado === 'NO_CONTESTO') return 'NO_CONTESTO';
    return this.subOpcionSeleccionada;
  }

  get motivoNoContesto(): string | undefined {
    if (this.pasoSeleccionado === 'NO_CONTESTO' && this.subOpcionSeleccionada) {
      return this.subOpcionSeleccionada;
    }
    return undefined;
  }

  get isScheduleRequired(): boolean {
    return this.subOpcionSeleccionada === 'AGENDADO';
  }

  isTerminal(value: string): boolean {
    return value === 'CONCRETO_PRESTAMO' || value === 'NO_VOLVER_LLAMAR';
  }

  get isFormValid(): boolean {
    if (!this.pasoSeleccionado || !this.subOpcionSeleccionada) return false;
    if (this.isScheduleRequired && (!this.fechaAgenda || !this.horaAgenda)) return false;
    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.isFormValid) return;

    let fechaAgendaISO: string | undefined;
    if (this.fechaAgenda && this.horaAgenda) {
      fechaAgendaISO = `${this.fechaAgenda}T${this.horaAgenda}:00`;
    }

    this.dialogRef.close({
      prospectoId: this.data.id,
      comentario: this.comentario,
      estadoResultado: this.estadoResultadoFinal,
      fechaAgenda: fechaAgendaISO,
      motivoNoContesto: this.motivoNoContesto
    });
  }
}
