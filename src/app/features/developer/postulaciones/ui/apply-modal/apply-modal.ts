import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Modal de postulación: pide una carta de presentación opcional antes de
 * enviar `applyToVacancy`. Mismo patrón visual que `app-confirm-modal`.
 */
@Component({
  selector: 'app-apply-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './apply-modal.html',
  styleUrl: './apply-modal.scss',
})
export class ApplyModal implements OnChanges {
  @Input() open = false;
  @Input() titulo = '';
  @Input() sending = false;
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  carta = '';

  ngOnChanges(changes: SimpleChanges): void {
    // cada apertura arranca con la carta vacía
    if (changes['open']?.currentValue === true) this.carta = '';
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
    this.confirm.emit(this.carta.trim());
  }
}
