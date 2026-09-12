import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-candidate-card',
  standalone: true,
  templateUrl: './candidate-card.html',
  styleUrl: './candidate-card.scss',
})
export class CandidateCard {
  @Input() id = 0;
  @Input() name = '';
  @Input() role = '';
  @Input() skills: string[] = [];
  @Input() avatar = '';
  @Input() experience = '';
  @Input() available = true;
  @Output() message = new EventEmitter<number>();
  @Output() contact = new EventEmitter<number>();
}
