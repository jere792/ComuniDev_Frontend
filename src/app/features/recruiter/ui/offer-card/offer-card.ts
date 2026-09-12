import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-offer-card',
  standalone: true,
  templateUrl: './offer-card.html',
  styleUrl: './offer-card.scss',
})
export class OfferCard {
  @Input() id = 0;
  @Input() title = '';
  @Input() company = '';
  @Input() location = '';
  @Input() salary = '';
  @Input() type = '';
  @Input() posted = '';
  @Input() applicants = 0;
  @Input() status: 'active' | 'paused' = 'active';
  @Output() edit = new EventEmitter<number>();
  @Output() viewApplicants = new EventEmitter<number>();
}
