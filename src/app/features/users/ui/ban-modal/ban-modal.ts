import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoBan } from '@features/users/domain/ports/user-moderation.repository';

export interface BanPayload {
  tipo: TipoBan;
  razon: string;
  /** Solo `TEMPORAL`; null en `PERMANENTE`. */
  duracionDias: number | null;
}

/**
 * Modal para suspender una cuenta desde el listado del admin: tipo
 * (PERMANENTE/TEMPORAL), motivo obligatorio y duración en días si es temporal.
 * Mismo estilo visual que `app-report-modal` / `app-apply-modal`.
 */
@Component({
  selector: 'app-ban-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ban-modal.html',
  styleUrl: './ban-modal.scss',
})
export class BanModal implements OnChanges {
  @Input() open = false;
  @Input() userName = '';
  @Input() sending = false;
  @Output() confirm = new EventEmitter<BanPayload>();
  @Output() cancel = new EventEmitter<void>();

  tipo: TipoBan = 'TEMPORAL';
  razon = '';
  duracionDias: number | null = 30;

  get esTemporal(): boolean {
    return this.tipo === 'TEMPORAL';
  }

  get puedeConfirmar(): boolean {
    if (!this.razon.trim()) return false;
    if (this.esTemporal) return (this.duracionDias ?? 0) > 0;
    return true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // cada apertura arranca con valores por defecto
    if (changes['open']?.currentValue === true) {
      this.tipo = 'TEMPORAL';
      this.razon = '';
      this.duracionDias = 30;
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  close(): void {
    if (this.sending) return;
    this.cancel.emit();
  }

  submit(): void {
    if (this.sending || !this.puedeConfirmar) return;
    this.confirm.emit({
      tipo: this.tipo,
      razon: this.razon.trim(),
      duracionDias: this.esTemporal ? this.duracionDias : null,
    });
  }
}
