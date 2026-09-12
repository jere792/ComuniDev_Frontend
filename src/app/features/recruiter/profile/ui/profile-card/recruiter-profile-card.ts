import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recruiter-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recruiter-profile-card.html',
  styleUrl: './recruiter-profile-card.scss',
})
export class RecruiterProfileCard {
  @Input() user: any;
  @Input() profile: any;
  @Input() uploadingImage = false;

  @Output() bannerClick = new EventEmitter<void>();
  @Output() photoClick = new EventEmitter<void>();
  @Output() bioClick = new EventEmitter<void>();

  getInitials(): string {
    const name = this.user?.nombre;
    return name ? name.substring(0, 2) : '';
  }
}
