import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  OnChanges,
  OnDestroy,
  inject,
  signal,
  effect,
  ChangeDetectorRef,
  SimpleChanges,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SocialStory, SocialStoryView } from '@features/recruiter/pages/inicio/domain/models/social-story.model';
import { StoryStore } from '@features/recruiter/pages/inicio/data-access/state/story.store';
import { UserStore } from '@features/users/data-access/state/user.store';
import { MusicaStore } from '@features/recruiter/pages/inicio/data-access/state/musica.store';

export interface StoryViewerUser {
  autorId: string;
  nombre: string;
  avatar: string;
  stories: SocialStory[];
}

@Component({
  selector: 'app-story-viewer',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './story-viewer.html',
  styleUrl: './story-viewer.scss',
})
export class StoryViewer implements OnChanges, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private musicaService = inject(MusicaStore);
  private storyStore = inject(StoryStore);
  private userStore = inject(UserStore);

  /** Quién está viendo; las vistas solo se registran y se listan en la historia propia. */
  readonly yo = localStorage.getItem('userId') ?? '';

  /** Personas que vieron la historia propia, con nombre y avatar ya resueltos. */
  mostrarVistas = signal(false);
  cargandoVistas = signal(false);
  vistas = signal<SocialStoryView[]>([]);
  nombresVistas = signal<Map<string, { nombre: string; avatar: string }>>(new Map());
  /** Cada historia se avisa como vista una sola vez por sesión. */
  private vistasAvisadas = new Set<string>();

  @Input() open = false;
  @Input() users: StoryViewerUser[] = [];
  @Input() startIndex = 0;
  @Input() accentColor: string | null = null;
  @Output() close = new EventEmitter<void>();

  viewingUser = signal<StoryViewerUser | null>(null);
  viewingIndex = signal(0);
  paused = signal(false);

  private storyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly STORY_DURATION = 30000;

  // Music
  private previewAudio: HTMLAudioElement | null = null;
  playingPreview = false;
  currentTime = signal(0);
  duration = signal(0);
  volume = 0.8;
  private audioPausedByHold = false;

  // Synced lyrics (LRC) for viewer
  viewerSyncedLines: { time: number; text: string }[] = [];
  viewerCurrentLyricIndex = signal(-1);
  viewerHasSyncedLyrics = false;
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

  // Hold-to-pause
  private holdStart = 0;
  private wasHolding = false;

  constructor() {
    effect(() => {
      const user = this.viewingUser();
      const idx = this.viewingIndex();
      if (user && user.stories[idx]?.contenido?.musica?.previewUrl) {
        this.playMusic(user.stories[idx].contenido!.musica!.previewUrl!);
      } else {
        this.stopPreview();
      }
    });
    //avisa al servidor cada vez que se muestra una historia (una sola vez por historia y sesión)
    effect(() => {
      const user = this.viewingUser();
      const story = user?.stories[this.viewingIndex()];
      if (!this.open || !user || !story?.id) return;
      this.registrarVista(story.id, user.autorId);
    });
  }

  private registrarVista(storyId: string, autorId: string): void {
    if (!this.yo || autorId === this.yo || this.vistasAvisadas.has(storyId)) return;
    this.vistasAvisadas.add(storyId);
    this.storyStore.viewStory(storyId, this.yo).subscribe({ error: () => {} });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.closeViewer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const openChanged = !!changes['open'];
    if (openChanged) {
      if (this.open) {
        this.openViewer();
      } else {
        this.resetState();
      }
    }
    if (changes['users'] && this.open && !openChanged) {
      this.openViewer();
    }
  }

  openViewer(): void {
    const start = Math.max(0, Math.min(this.startIndex, this.users.length - 1));
    this.viewingUser.set(this.users[start] ?? null);
    this.viewingIndex.set(0);
    this.paused.set(false);
    if (this.viewingUser()) {
      this.fetchViewerSyncedLyrics();
      this.startStoryTimer();
    }
  }

  closeViewer(): void {
    this.close.emit();
  }

  /** Solo en mis historias se puede ver quién las vio. */
  esHistoriaPropia(): boolean {
    const vu = this.viewingUser();
    return !!vu && !!this.yo && vu.autorId === this.yo;
  }

  abrirVistas(): void {
    const story = this.viewingUser()?.stories[this.viewingIndex()];
    if (!story?.id) return;
    this.mostrarVistas.set(true);
    this.cargandoVistas.set(true);
    this.storyStore.getStoryViews(story.id).subscribe({
      next: (vistas) => {
        this.vistas.set(vistas);
        this.cargandoVistas.set(false);
        this.resolverNombres(vistas);
      },
      error: () => this.cargandoVistas.set(false),
    });
  }

  cerrarVistas(): void {
    this.mostrarVistas.set(false);
  }

  /** Nombre y avatar de cada persona que vio la historia (una petición por id). */
  private resolverNombres(vistas: SocialStoryView[]): void {
    vistas.forEach((v) => {
      if (!v.viewerId || this.nombresVistas().has(v.viewerId)) return;
      this.userStore.getById(v.viewerId).subscribe({
        next: (u: any) => {
          if (!u) return;
          this.nombresVistas.update((m) => {
            const copia = new Map(m);
            copia.set(v.viewerId, { nombre: u.nombre ?? 'Usuario', avatar: u.fotoPerfilUrl ?? '' });
            return copia;
          });
        },
        error: () => {},
      });
    });
  }

  private resetState(): void {
    this.viewingUser.set(null);
    this.viewingIndex.set(0);
    this.paused.set(false);
    this.stopStoryTimer();
    this.stopPreview();
    this.viewerSyncedLines = [];
    this.viewerHasSyncedLyrics = false;
    this.viewerCurrentLyricIndex.set(-1);
  }

  nextStory(): void {
    const user = this.viewingUser();
    if (!user) return;
    if (this.viewingIndex() < user.stories.length - 1) {
      this.viewingIndex.update(i => i + 1);
      this.fetchViewerSyncedLyrics();
      this.resetStoryTimer();
    } else {
      const idx = this.users.indexOf(user);
      if (idx < this.users.length - 1) {
        this.viewingUser.set(this.users[idx + 1]);
        this.viewingIndex.set(0);
        this.fetchViewerSyncedLyrics();
        this.resetStoryTimer();
      } else {
        this.closeViewer();
      }
    }
  }

  prevStory(): void {
    const user = this.viewingUser();
    if (!user) return;
    if (this.viewingIndex() > 0) {
      this.viewingIndex.update(i => i - 1);
      this.fetchViewerSyncedLyrics();
      this.resetStoryTimer();
    } else {
      const idx = this.users.indexOf(user);
      if (idx > 0) {
        const prev = this.users[idx - 1];
        this.viewingUser.set(prev);
        this.viewingIndex.set(prev.stories.length - 1);
        this.fetchViewerSyncedLyrics();
        this.resetStoryTimer();
      }
    }
  }

  // ─── Hold to pause ───

  onHoldStart(): void {
    this.holdStart = Date.now();
    this.wasHolding = false;
    this.paused.set(true);
    this.stopStoryTimer();
    if (this.previewAudio && !this.previewAudio.paused) {
      this.previewAudio.pause();
      this.audioPausedByHold = true;
    }
  }

  onHoldEnd(): void {
    if (Date.now() - this.holdStart > 250) {
      this.wasHolding = true;
    }
    if (!this.open) return;
    this.paused.set(false);
    this.startStoryTimer();
    if (this.audioPausedByHold && this.previewAudio) {
      this.previewAudio.play().catch(() => {});
      this.audioPausedByHold = false;
    }
  }

  onContentClick(): void {
    if (this.wasHolding) {
      this.wasHolding = false;
      return;
    }
    this.nextStory();
  }

  // ─── Audio ───

  togglePreview(track: { previewUrl?: string }, event: Event): void {
    event.stopPropagation();
    if (!track.previewUrl) return;
    if (this.previewAudio && !this.previewAudio.paused) {
      this.previewAudio.pause();
      this.playingPreview = false;
      this.stopStoryTimer();
      this.cdr.detectChanges();
    } else if (this.previewAudio) {
      this.previewAudio.play();
      this.playingPreview = true;
      this.resetStoryTimer();
      this.cdr.detectChanges();
    } else {
      this.playMusic(track.previewUrl);
    }
  }

  onVolumeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.volume = parseFloat(input.value);
    if (this.previewAudio) {
      this.previewAudio.volume = this.volume;
    }
  }

  playMusic(url: string): void {
    if (this.previewAudio && !this.previewAudio.paused) {
      this.previewAudio.pause();
      this.playingPreview = false;
      if (this.previewAudio.src === url) {
        return;
      }
    }
    this.currentTime.set(0);
    this.duration.set(0);
    this.previewAudio = new Audio(url);
    this.previewAudio.volume = this.volume;
    this.previewAudio.loop = true;
    this.previewAudio.addEventListener('loadedmetadata', () => {
      this.duration.set(this.previewAudio?.duration ?? 0);
      this.cdr.detectChanges();
    });
    this.previewAudio.addEventListener('timeupdate', () => {
      this.currentTime.set(this.previewAudio?.currentTime ?? 0);
    });
    this.previewAudio.play().catch(() => {
      this.playingPreview = false;
    });
    this.playingPreview = true;
  }

  private stopPreview(): void {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
      this.playingPreview = false;
    }
    this.stopLyricTracking();
  }

  // ─── Synced Lyrics ───

  private fetchViewerSyncedLyrics(): void {
    this.viewerSyncedLines = [];
    this.viewerHasSyncedLyrics = false;
    this.viewerCurrentLyricIndex.set(-1);
    this.stopLyricTracking();

    const vu = this.viewingUser();
    if (!vu) return;
    const story = vu.stories[this.viewingIndex()];
    const musica = story?.contenido?.musica;
    if (!musica?.artistName || !musica?.trackName) return;

    this.musicaService.fetchLyrics(musica.artistName, musica.trackName).subscribe({
      next: (res) => {
        if (res?.syncedLyrics) {
          this.viewerSyncedLines = this.parseLrc(res.syncedLyrics);
          this.viewerHasSyncedLyrics = this.viewerSyncedLines.length > 0;
          if (this.viewerHasSyncedLyrics) {
            this.startViewerLyricTracking();
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  private startViewerLyricTracking(): void {
    this.stopLyricTracking();
    if (!this.viewerHasSyncedLyrics) return;
    this.timeUpdateInterval = setInterval(() => {
      if (!this.previewAudio) return;
      const currentTime = this.previewAudio.currentTime;
      let idx = -1;
      for (let i = this.viewerSyncedLines.length - 1; i >= 0; i--) {
        if (currentTime >= this.viewerSyncedLines[i].time) {
          idx = i;
          break;
        }
      }
      if (idx !== this.viewerCurrentLyricIndex()) {
        this.viewerCurrentLyricIndex.set(idx);
        this.cdr.detectChanges();
      }
    }, 100);
  }

  private parseLrc(lrc: string): { time: number; text: string }[] {
    const lines = lrc.split('\n');
    const result: { time: number; text: string }[] = [];
    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0'), 10);
        const time = min * 60 + sec + ms / 1000;
        const text = match[4].trim();
        if (text) {
          result.push({ time, text });
        }
      }
    }
    return result.sort((a, b) => a.time - b.time);
  }

  private stopLyricTracking(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
    this.viewerCurrentLyricIndex.set(-1);
  }

  // ─── Story Auto-Advance Timer ───

  private startStoryTimer(): void {
    this.stopStoryTimer();
    this.storyTimer = setTimeout(() => {
      this.nextStory();
    }, this.STORY_DURATION);
  }

  private resetStoryTimer(): void {
    this.paused.set(false);
    this.startStoryTimer();
  }

  private stopStoryTimer(): void {
    if (this.storyTimer) {
      clearTimeout(this.storyTimer);
      this.storyTimer = null;
    }
  }

  // ─── Helpers ───

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  goToProfile(autorId: string): void {
    this.closeViewer();
    this.router.navigate(['/profile', autorId]);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeViewer();
  }

  ngOnDestroy(): void {
    this.stopLyricTracking();
    this.stopStoryTimer();
    this.stopPreview();
  }
}
