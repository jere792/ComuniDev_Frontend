import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MusicaStore } from '@features/recruiter/pages/inicio/data-access/state/musica.store';
import { MusicTrackResponse } from '@features/recruiter/pages/inicio/domain/models/music.model';

export interface BannerVideoRecorte {
  inicio: number;
  fin: number;
  musica: { nombre: string; artista: string; url: string } | null;
}

/**
 * Modal de recorte del banner de video.
 *
 * El video original puede durar lo que sea; lo que se guarda es el tramo
 * elegido y ese tramo no puede pasar de 60 segundos (regla del sistema).
 * La musica es opcional y se reproduce en el perfil junto al video.
 */
@Component({
  selector: 'app-video-banner-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-banner-modal.html',
  styleUrl: './video-banner-modal.scss',
})
export class VideoBannerModal implements OnChanges {
  @Input() open = false;
  @Input() file: File | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<BannerVideoRecorte>();

  readonly musica = inject(MusicaStore);

  @ViewChild('preview') private preview?: ElementRef<HTMLVideoElement>;

  readonly objectUrl = signal<string | null>(null);
  readonly duracion = signal(0);
  readonly inicio = signal(0);
  readonly fin = signal(0);
  readonly seleccionada = signal<MusicTrackResponse | null>(null);
  busqueda = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['file']) return;
    const anterior = this.objectUrl();
    if (anterior) URL.revokeObjectURL(anterior);
    this.objectUrl.set(null);
    this.duracion.set(0);
    this.inicio.set(0);
    this.fin.set(0);
    this.seleccionada.set(null);
    this.busqueda = '';
    this.musica.clear();
    if (this.file) {
      this.objectUrl.set(URL.createObjectURL(this.file));
    }
  }

  onMetadata(event: Event): void {
    const video = event.target as HTMLVideoElement;
    const total = Number.isFinite(video.duration) ? video.duration : 0;
    this.duracion.set(total);
    this.inicio.set(0);
    this.fin.set(Math.min(total, 60));
  }

  /** Segundos del tramo elegido (el maximo permitido es 60). */
  get recorte(): number {
    return Math.max(0, this.fin() - this.inicio());
  }

  get valido(): boolean {
    return this.duracion() > 0 && this.recorte > 0.5 && this.recorte <= 60.001;
  }

  moverInicio(valor: number | string): void {
    const total = this.duracion();
    const inicio = Math.min(Math.max(0, Number(valor)), Math.max(0, total - 0.5));
    this.inicio.set(inicio);
    if (this.fin() - inicio > 60) {
      this.fin.set(Math.min(total, inicio + 60));
    }
    if (this.fin() <= inicio) {
      this.fin.set(Math.min(total, inicio + Math.min(60, total - inicio)));
    }
  }

  moverFin(valor: number | string): void {
    const total = this.duracion();
    const inicio = this.inicio();
    let fin = Math.min(Math.max(inicio + 0.5, Number(valor)), total);
    if (fin - inicio > 60) {
      fin = inicio + 60;
    }
    this.fin.set(fin);
  }

  /** Reproduce solo el tramo elegido para previsualizarlo. */
  previsualizar(): void {
    const video = this.preview?.nativeElement;
    if (!video) return;
    video.currentTime = this.inicio();
    video.play().catch(() => undefined);
  }

  onTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (video.currentTime >= this.fin()) {
      video.pause();
      video.currentTime = this.inicio();
    } else if (video.currentTime < this.inicio() - 0.2) {
      video.currentTime = this.inicio();
    }
  }

  buscarMusica(): void {
    const q = this.busqueda.trim();
    if (q.length < 2) return;
    this.musica.search(q);
  }

  elegirMusica(track: MusicTrackResponse): void {
    this.seleccionada.set(track);
  }

  quitarMusica(): void {
    this.seleccionada.set(null);
  }

  confirmar(): void {
    if (!this.valido) return;
    const track = this.seleccionada();
    this.save.emit({
      inicio: this.inicio(),
      fin: this.fin(),
      musica: track ? { nombre: track.title, artista: track.artist, url: track.previewUrl } : null,
    });
  }
}
