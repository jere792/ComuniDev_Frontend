import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-saved-card',
  standalone: true,
  templateUrl: './saved-card.html',
  styleUrl: './saved-card.scss',
})
export class SavedCard {
  @Input() id = '';
  /** id del usuario (developer) a cuyo perfil se navega al hacer clic */
  @Input() userId = '';
  @Input() type: 'candidate' | 'reel' = 'candidate';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() avatar = '';
  @Input() buscandoEmpleo = false;
  @Input() meta = '';
  @Input() savedAt = '';
  @Output() remove = new EventEmitter<string>();
  @Output() viewProfile = new EventEmitter<string>();

  get initials(): string {
    return (this.title || '?')
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
