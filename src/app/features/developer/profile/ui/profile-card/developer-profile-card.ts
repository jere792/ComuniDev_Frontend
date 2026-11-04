import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal } from '@angular/core';
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

  @ViewChild('bannerAudio') private bannerAudio?: ElementRef<HTMLAudioElement>;
  @ViewChild('bannerVideo') private bannerVideo?: ElementRef<HTMLVideoElement>;

  /**
   * Preferencia de silencio del banner (persistida en el navegador).
   * Arranca silenciado por defecto: los navegadores bloquean el autoplay con
   * sonido, y el banner debe reproducirse sin molestar hasta que el usuario
   * pulse el boton.
   */
  readonly musicaSilenciada = signal(
    localStorage.getItem('bannerMusicMuted') === null
      ? true
      : localStorage.getItem('bannerMusicMuted') === '1',
  );

  /**
   * Silencia/activa TODO el sonido del banner: si hay una pista de musica
   * elegida controla esa pista (el video queda muteado para no duplicar audio);
   * si no hay pista, controla el audio propio del video.
   */
  toggleMusica(): void {
    const silenciada = !this.musicaSilenciada();
    this.musicaSilenciada.set(silenciada);
    localStorage.setItem('bannerMusicMuted', silenciada ? '1' : '0');

    const audio = this.bannerAudio?.nativeElement;
    const video = this.bannerVideo?.nativeElement;

    if (audio) {
      audio.muted = silenciada;
      if (!silenciada) audio.play().catch(() => undefined);
    }
    if (video) {
      // con pista de musica el video va siempre muteado (evita doble audio)
      video.muted = audio ? true : silenciada;
      if (!silenciada) video.play().catch(() => undefined);
    }
  }

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
    video.play().catch(() => {
      // autoplay con sonido bloqueado: se silencia para que el banner se mueva
      video.muted = true;
      this.musicaSilenciada.set(true);
      localStorage.setItem('bannerMusicMuted', '1');
      video.play().catch(() => undefined);
    });
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
