import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-saved-card',
  standalone: true,
  templateUrl: './saved-card.html',
  styleUrl: './saved-card.scss',
})
export class SavedCard {
  @Input() id = 0;
  @Input() type: 'candidate' | 'reel' = 'candidate';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() avatar = '';
  @Input() savedAt = '';
  @Output() remove = new EventEmitter<number>();
}
