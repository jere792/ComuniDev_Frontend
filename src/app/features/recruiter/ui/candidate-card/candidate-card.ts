import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-candidate-card',
  standalone: true,
  templateUrl: './candidate-card.html',
  styleUrl: './candidate-card.scss',
})
export class CandidateCard {
  @Input() id = '';
  @Input() name = '';
  @Input() role = '';
  @Input() skills: string[] = [];
  @Input() avatar = '';
  @Input() experience = '';
  @Input() available = true;
  @Input() saved = false;
  @Output() message = new EventEmitter<string>();
  @Output() contact = new EventEmitter<string>();
  @Output() saveToggle = new EventEmitter<string>();
  @Output() viewProfile = new EventEmitter<string>();

  get initials(): string {
    return (this.name || '?')
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
