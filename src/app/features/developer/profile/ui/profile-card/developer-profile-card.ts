import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialListType } from '@features/recruiter/pages/profile/ui/social-list-modal/social-list-modal';

@Component({
  selector: 'app-developer-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './developer-profile-card.html',
  styleUrl: './developer-profile-card.scss',
})
export class DeveloperProfileCard {
  @Input() user: any;
  @Input() profile: any;
  @Input() uploadingImage = false;

  @Output() bannerClick = new EventEmitter<void>();
  @Output() photoClick = new EventEmitter<void>();
  @Output() bioClick = new EventEmitter<void>();
  @Output() statClick = new EventEmitter<SocialListType>();

  openStat(type: SocialListType): void {
    this.statClick.emit(type);
  }

  getInitials(): string {
    const name = this.user?.nombre;
    return name ? name.substring(0, 2) : '';
  }
}
