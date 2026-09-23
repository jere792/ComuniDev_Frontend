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
}
