import { Component, OnInit, inject, signal, ChangeDetectorRef, effect, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { StoryGraphqlService, SocialStory } from '../../../../../core/services/social/story-graphql.service';
import { GraphQLService } from '../../../../../core/services/graphql.service';
import { MusicaService, MusicTrackResponse } from '../../../../../core/services/social/musica.service';

type MusicMode = 'cover' | 'audio' | 'lyrics' | 'cover+lyrics';

interface StoryUser {
  autorId: string;
  nombre: string;
  avatar: string;
  stories: SocialStory[];
}

@Component({
  selector: 'app-stories',
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './stories.html',
  styleUrl: './stories.scss',
})
export class StoriesComponent implements OnInit, OnDestroy {
  private storyService = inject(StoryGraphqlService);
  private graphql = inject(GraphQLService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private musicaService = inject(MusicaService);

  storyUsers = signal<StoryUser[]>([]);
  showComposer = signal(false);
  storyImage: string | null = null;
  storyText = '';
  uploading = false;
  creating = false;

  // Music modal
  showMusicModal = signal(false);
  musicQuery = '';
  musicResults = signal<MusicTrackResponse[]>([]);
  selectedMusic: MusicTrackResponse | null = null;
  searchingMusic = false;
  hasSearched = false;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // Music mode & lyrics
  musicMode: MusicMode = 'cover';
  lyricsText = '';
  lyricsPos = signal({ x: 50, y: 70 }); // percentage
  coverPos = signal({ x: 50, y: 40 }); // percentage
  lyricsScale = signal(1);
  coverScale = signal(1);
  lyricsLoading = false;
  private isDraggingLyrics = false;
  private isDraggingCover = false;
  private dragStart = { x: 0, y: 0 };
  private lyricsStart = { x: 0, y: 0 };
  private coverStart = { x: 0, y: 0 };

  // Pinch state
  private pinchStartDistance = 0;
  private pinchStartScale = 1;
  private pinchTarget: 'lyrics' | 'cover' | null = null;

  // Synced lyrics (LRC)
  syncedLyricsLines: { time: number; text: string }[] = [];
  currentLyricIndex = signal(-1);
  hasSyncedLyrics = false;
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

  // Audio
  previewAudio: HTMLAudioElement | null = null;
  playingPreview = false;
  currentTime = signal(0);
  duration = signal(0);
  volume = 0.8;

  // Viewer
  viewingUser = signal<StoryUser | null>(null);
  viewingIndex = signal(0);
  private storyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly STORY_DURATION = 30000; // 30 seconds

  private userCache = new Map<string, { nombre: string; avatar: string }>();

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
  }

  private getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  ngOnInit(): void {
    this.loadStories();
  }

  private loadStories(): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.storyService.getStories(userId).subscribe({
      next: (data: SocialStory[]) => {
        console.log('Stories loaded:', data.length, data);
        const grouped = this.groupByAutor(data);
        console.log('Grouped stories:', grouped);
        this.storyUsers.set(grouped);
        grouped.forEach(g => this.loadUserNames(g));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load stories:', err);
      }
    });
  }

  private groupByAutor(stories: SocialStory[]): StoryUser[] {
    const map = new Map<string, SocialStory[]>();
    for (const s of stories) {
      const arr = map.get(s.autorId) ?? [];
      arr.push(s);
      map.set(s.autorId, arr);
    }
    return Array.from(map.entries()).map(([autorId, userStories]) => ({
      autorId,
      nombre: '',
      avatar: '',
      stories: userStories.sort((a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      ),
    }));
  }

  private loadUserNames(group: StoryUser): void {
    if (this.userCache.has(group.autorId)) {
      const info = this.userCache.get(group.autorId)!;
      group.nombre = info.nombre;
      group.avatar = info.avatar;
      this.storyUsers.update(u => [...u]);
      return;
    }

    this.graphql.getUser(group.autorId).subscribe({
      next: (user: any) => {
        if (user) {
          const info = { nombre: user.nombre ?? 'Usuario', avatar: user.fotoPerfilUrl ?? '' };
          this.userCache.set(group.autorId, info);
          group.nombre = info.nombre;
          group.avatar = info.avatar;
          this.storyUsers.update(u => [...u]);
        }
      },
      error: () => {}
    });
  }

  // ─── Composer ───

  toggleComposer(): void {
    this.showComposer.update(v => !v);
    if (!this.showComposer()) {
      this.resetComposer();
    }
  }

  private resetComposer(): void {
    this.storyImage = null;
    this.storyText = '';
    this.selectedMusic = null;
    this.musicMode = 'cover';
    this.lyricsText = '';
    this.lyricsPos.set({ x: 50, y: 70 });
    this.coverPos.set({ x: 50, y: 40 });
    this.lyricsScale.set(1);
    this.coverScale.set(1);
    this.syncedLyricsLines = [];
    this.hasSyncedLyrics = false;
    this.currentLyricIndex.set(-1);
    this.musicResults.set([]);
    this.musicQuery = '';
    this.showMusicModal.set(false);
    this.hasSearched = false;
    this.stopPreview();
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.cdr.detectChanges();
    this.resizeImage(file).then((resizedBlob) => {
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      this.graphql.uploadFile(resizedFile).subscribe({
        next: (res: any) => {
          this.storyImage = res?.secure_url ?? res?.url ?? null;
          this.uploading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to upload image:', err);
          this.uploading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  createStory(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const hasContent = this.storyImage || this.storyText.trim() || this.selectedMusic;
    if (!hasContent) return;

    this.creating = true;
    const contenido: any = {};
    if (this.storyImage) contenido.imagenUrl = this.storyImage;
    if (this.storyText.trim()) contenido.texto = this.storyText.trim();
    if (this.selectedMusic) {
      contenido.musica = {
        trackId: this.selectedMusic.id,
        trackName: this.selectedMusic.title,
        artistName: this.selectedMusic.artist,
        coverUrl: this.selectedMusic.coverUrl,
        previewUrl: this.selectedMusic.previewUrl,
        musicMode: this.musicMode,
        lyricsText: (this.musicMode === 'lyrics' || this.musicMode === 'cover+lyrics') ? this.lyricsText : null,
        lyricsPosX: this.lyricsPos().x,
        lyricsPosY: this.lyricsPos().y,
        coverPosX: this.coverPos().x,
        coverPosY: this.coverPos().y,
        lyricsScale: this.lyricsScale(),
        coverScale: this.coverScale(),
      };
    }

    this.storyService.createStory(userId, contenido).subscribe({
      next: (created: SocialStory) => {
        if (created) {
          this.loadStories();
          this.toggleComposer();
        }
        this.creating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to create story:', err);
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Music Modal ───

  toggleMusicPanel(): void {
    if (this.showMusicModal()) {
      this.closeMusicModal();
    } else {
      this.openMusicModal();
    }
  }

  openMusicModal(): void {
    this.showMusicModal.set(true);
    this.musicQuery = '';
    this.musicResults.set([]);
    this.hasSearched = false;
  }

  closeMusicModal(): void {
    this.showMusicModal.set(false);
    this.stopPreview();
  }

  onMusicQueryChange(): void {
    const query = this.musicQuery.trim();
    if (!query) {
      this.musicResults.set([]);
      this.hasSearched = false;
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
        this.searchTimer = null;
      }
      return;
    }
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.searchMusic();
    }, 300);
  }

  searchMusic(): void {
    const query = this.musicQuery.trim();
    if (!query) {
      this.musicResults.set([]);
      this.hasSearched = false;
      return;
    }
    this.searchingMusic = true;
    this.hasSearched = true;
    this.musicaService.buscar(query).subscribe({
      next: (results) => {
        this.musicResults.set(results);
        this.searchingMusic = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error buscando música:', err);
        this.musicResults.set([]);
        this.searchingMusic = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectMusic(track: MusicTrackResponse): void {
    this.selectedMusic = track;
    this.showMusicModal.set(false);
    this.musicResults.set([]);
    this.musicQuery = '';
    // Clear old lyrics
    this.lyricsText = '';
    this.syncedLyricsLines = [];
    this.hasSyncedLyrics = false;
    this.currentLyricIndex.set(-1);
    // Fetch new lyrics if in lyrics mode
    if (this.musicMode === 'lyrics' || this.musicMode === 'cover+lyrics') {
      this.fetchLyricsAutomatically();
    }
    if (track.previewUrl) {
      this.playMusic(track.previewUrl);
    }
    this.cdr.detectChanges();
  }

  removeMusic(): void {
    this.selectedMusic = null;
    this.musicMode = 'cover';
    this.lyricsText = '';
    this.syncedLyricsLines = [];
    this.hasSyncedLyrics = false;
    this.currentLyricIndex.set(-1);
    this.stopPreview();
    this.cdr.detectChanges();
  }

  setMusicMode(mode: MusicMode): void {
    this.musicMode = mode;
    if ((mode === 'lyrics' || mode === 'cover+lyrics') && this.selectedMusic) {
      this.fetchLyricsAutomatically();
    }
    this.cdr.detectChanges();
  }

  private fetchLyricsAutomatically(): void {
    if (!this.selectedMusic) return;
    this.lyricsLoading = true;
    this.musicaService.fetchLyrics(this.selectedMusic.artist, this.selectedMusic.title).subscribe({
      next: (res) => {
        this.lyricsLoading = false;
        if (res) {
          if (res.syncedLyrics) {
            this.syncedLyricsLines = this.parseLrc(res.syncedLyrics);
            this.hasSyncedLyrics = this.syncedLyricsLines.length > 0;
            this.lyricsText = this.syncedLyricsLines.map(l => l.text).join('\n');
          } else if (res.plainLyrics) {
            this.lyricsText = res.plainLyrics;
            this.hasSyncedLyrics = false;
          }
        }
        // Start tracking if music is already playing
        if (this.hasSyncedLyrics && this.previewAudio && !this.previewAudio.paused) {
          this.startLyricTracking();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.lyricsLoading = false;
        this.cdr.detectChanges();
      }
    });
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

  private startLyricTracking(): void {
    this.stopLyricTracking();
    if (!this.hasSyncedLyrics) return;
    this.timeUpdateInterval = setInterval(() => {
      if (!this.previewAudio) return;
      const currentTime = this.previewAudio.currentTime;
      let idx = -1;
      for (let i = this.syncedLyricsLines.length - 1; i >= 0; i--) {
        if (currentTime >= this.syncedLyricsLines[i].time) {
          idx = i;
          break;
        }
      }
      if (idx !== this.currentLyricIndex()) {
        this.currentLyricIndex.set(idx);
        this.cdr.detectChanges();
      }
    }, 100);
  }

  private stopLyricTracking(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
    this.currentLyricIndex.set(-1);
  }

  ngOnDestroy(): void {
    this.stopLyricTracking();
    this.stopStoryTimer();
    this.stopPreview();
  }

  // ─── Lyrics Drag ───

  onLyricsMouseDown(event: MouseEvent | TouchEvent): void {
    this.isDraggingLyrics = true;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.dragStart = { x: clientX, y: clientY };
    this.lyricsStart = { ...this.lyricsPos() };
  }

  onLyricsMouseMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDraggingLyrics) return;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const dx = clientX - this.dragStart.x;
    const dy = clientY - this.dragStart.y;
    // Convert pixel delta to percentage (assuming 375px phone width, 667px height)
    const newX = Math.max(5, Math.min(95, this.lyricsStart.x + (dx / 3.75)));
    const newY = Math.max(5, Math.min(95, this.lyricsStart.y + (dy / 6.67)));
    this.lyricsPos.set({ x: newX, y: newY });
  }

  onLyricsMouseUp(): void {
    this.isDraggingLyrics = false;
  }

  // ─── Cover Drag ───

  onCoverMouseDown(event: MouseEvent | TouchEvent): void {
    this.isDraggingCover = true;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    this.dragStart = { x: clientX, y: clientY };
    this.coverStart = { ...this.coverPos() };
    event.preventDefault();
  }

  onCoverMouseMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDraggingCover) return;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const dx = clientX - this.dragStart.x;
    const dy = clientY - this.dragStart.y;
    const newX = Math.max(5, Math.min(95, this.coverStart.x + (dx / 3.75)));
    const newY = Math.max(5, Math.min(95, this.coverStart.y + (dy / 6.67)));
    this.coverPos.set({ x: newX, y: newY });
  }

  onCoverMouseUp(): void {
    this.isDraggingCover = false;
  }

  // ─── Zoom Buttons (Desktop) ───

  zoomLyricsIn(): void {
    this.lyricsScale.update(s => Math.min(3, +(s + 0.15).toFixed(2)));
  }

  zoomLyricsOut(): void {
    this.lyricsScale.update(s => Math.max(0.3, +(s - 0.15).toFixed(2)));
  }

  zoomCoverIn(): void {
    this.coverScale.update(s => Math.min(3, +(s + 0.15).toFixed(2)));
  }

  zoomCoverOut(): void {
    this.coverScale.update(s => Math.max(0.3, +(s - 0.15).toFixed(2)));
  }

  // ─── Pinch to Zoom (Mobile) ───

  onLyricsTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault();
      event.stopPropagation();
      this.pinchTarget = 'lyrics';
      this.pinchStartDistance = this.getTouchDistance(event.touches);
      this.pinchStartScale = this.lyricsScale();
    }
  }

  onLyricsTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2 && this.pinchTarget === 'lyrics') {
      event.preventDefault();
      event.stopPropagation();
      const currentDistance = this.getTouchDistance(event.touches);
      const ratio = currentDistance / this.pinchStartDistance;
      const newScale = Math.max(0.3, Math.min(3, this.pinchStartScale * ratio));
      this.lyricsScale.set(+newScale.toFixed(2));
    }
  }

  onLyricsTouchEnd(): void {
    this.pinchTarget = null;
  }

  onCoverTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault();
      event.stopPropagation();
      this.pinchTarget = 'cover';
      this.pinchStartDistance = this.getTouchDistance(event.touches);
      this.pinchStartScale = this.coverScale();
    }
  }

  onCoverTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2 && this.pinchTarget === 'cover') {
      event.preventDefault();
      event.stopPropagation();
      const currentDistance = this.getTouchDistance(event.touches);
      const ratio = currentDistance / this.pinchStartDistance;
      const newScale = Math.max(0.3, Math.min(3, this.pinchStartScale * ratio));
      this.coverScale.set(+newScale.toFixed(2));
    }
  }

  onCoverTouchEnd(): void {
    this.pinchTarget = null;
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
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
    if (this.hasSyncedLyrics) {
      this.startLyricTracking();
    }
  }

  private stopPreview(): void {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
      this.playingPreview = false;
    }
    this.stopLyricTracking();
  }

  // ─── Viewer ───

  viewerSyncedLines: { time: number; text: string }[] = [];
  viewerCurrentLyricIndex = signal(-1);
  viewerHasSyncedLyrics = false;

  openStory(user: StoryUser): void {
    this.viewingUser.set(user);
    this.viewingIndex.set(0);
    this.fetchViewerSyncedLyrics();
    this.startStoryTimer();
  }

  closeViewer(): void {
    this.viewingUser.set(null);
    this.viewingIndex.set(0);
    this.stopPreview();
    this.stopStoryTimer();
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
      const users = this.storyUsers();
      const currentIdx = users.indexOf(user);
      if (currentIdx < users.length - 1) {
        this.viewingUser.set(users[currentIdx + 1]);
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
      const users = this.storyUsers();
      const currentIdx = users.indexOf(user);
      if (currentIdx > 0) {
        this.viewingUser.set(users[currentIdx - 1]);
        const prev = users[currentIdx - 1];
        this.viewingIndex.set(prev.stories.length - 1);
      }
    }
  }

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
      error: () => {}
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

  // ─── Story Auto-Advance Timer ───

  private startStoryTimer(): void {
    this.stopStoryTimer();
    this.storyTimer = setTimeout(() => {
      this.nextStory();
    }, this.STORY_DURATION);
  }

  private resetStoryTimer(): void {
    this.startStoryTimer();
  }

  private stopStoryTimer(): void {
    if (this.storyTimer) {
      clearTimeout(this.storyTimer);
      this.storyTimer = null;
    }
  }

  private resizeImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1080;
          const MAX_HEIGHT = 1920;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  goToProfile(autorId: string): void {
    this.router.navigate(['/profile', autorId]);
  }
}
