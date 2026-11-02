import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ACCION_ICONOS,
  ACCION_LABELS,
  ReportAccion,
} from '@features/moderator/feature/reports/domain/models/report.model';

/**
 * Modal de resolución de un reporte: Rechazar (solo cierra), Ocultar contenido
 * u Ocultar + Sancionar. En Ocultar/Sancionar pide notas opcionales al
 * moderador, igual que `app-apply-modal` en espíritu y estilo.
 */
@Component({
  selector: 'app-report-resolve-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './resolve-modal.html',
  styleUrl: './resolve-modal.scss',
})
export class ReportResolveModal implements OnChanges {
  @Input() open = false;
  @Input() accion: ReportAccion = 'RECHAZAR';
  /** Motivo del reporte, para dar contexto dentro del modal. */
  @Input() motivo = '';
  @Input() sending = false;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  notas = '';

  ngOnChanges(changes: SimpleChanges): void {
    // cada apertura arranca con las notas vacías
    if (changes['open']?.currentValue === true) this.notas = '';
  }

  get titulo(): string {
    const base = ACCION_LABELS[this.accion] ?? this.accion;
    return this.accion === 'RECHAZAR' ? 'Rechazar reporte' : `${base} contenido`;
  }

  get mensaje(): string {
    switch (this.accion) {
      case 'OCULTAR':
        return 'El contenido reportado dejará de mostrarse en la plataforma.';
      case 'SANCIONAR':
        return 'El contenido se ocultará y el autor recibirá una sanción (penalización de puntos).';
      default:
        return 'El reporte se cerrará sin acción sobre el contenido reportado.';
    }
  }

  get icono(): string {
    return ACCION_ICONOS[this.accion] ?? 'flag';
  }

  get confirmLabel(): string {
    return ACCION_LABELS[this.accion] ?? 'Confirmar';
  }

  get pideNotas(): boolean {
    return this.accion !== 'RECHAZAR';
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  close(): void {
    if (this.sending) return;
    this.cancel.emit();
  }

  submit(): void {
    if (this.sending) return;
    this.confirm.emit(this.notas.trim());
  }
}
