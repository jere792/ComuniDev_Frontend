import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ReportPayload {
  motivo: string;
  descripcion: string;
}

/** Modal para reportar contenido: elige la causa y agrega una descripción. */
@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-modal.html',
  styleUrl: './report-modal.scss',
})
export class ReportModal {
  @Input() open = false;
  @Input() title = 'Reportar contenido';
  @Input() confirmText = 'Enviar reporte';
  @Input() cancelText = 'Cancelar';
  @Output() confirm = new EventEmitter<ReportPayload>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  /** Causas del reporte que puede elegir el usuario. */
  motivos: string[] = [
    'Spam o publicidad engañosa',
    'Acoso o bullying',
    'Contenido inapropiado u ofensivo',
    'Violencia o amenazas',
    'Desinformación engañosa',
    'Otro motivo',
  ];

  motivo: string | null = null;
  descripcion = '';

  selectMotivo(motivo: string): void {
    this.motivo = motivo;
  }

  onConfirm(): void {
    if (!this.motivo) return;
    this.confirm.emit({ motivo: this.motivo, descripcion: this.descripcion.trim() });
    this.reset();
  }

  onCancel(): void {
    this.cancel.emit();
    this.close.emit();
    this.reset();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  private reset(): void {
    this.motivo = null;
    this.descripcion = '';
  }
}
