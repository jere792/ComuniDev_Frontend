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

  /** El banner de video arranca en el inicio del recorte guardado. */
  onVideoMeta(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.currentTime = this.user?.bannerInicio ?? 0;
    video.play().catch(() => undefined);
  }

  /** Al llegar al fin del recorte, vuelve al inicio (loop del tramo). */
  onVideoTime(event: Event): void {
    const video = event.target as HTMLVideoElement;
    const inicio = this.user?.bannerInicio ?? 0;
    const fin = this.user?.bannerFin;
    if (fin && fin > inicio && video.currentTime >= fin) {
      video.currentTime = inicio;
    }
  }
}
