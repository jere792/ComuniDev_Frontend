import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialReel } from '@features/recruiter/pages/reels/domain/models/social-reel.model';
import { CreateReelRequest, REEL_REPOSITORY, ReelRepository, UpdateReelRequest } from '@features/recruiter/pages/reels/domain/ports/reel.repository';

@Injectable({ providedIn: 'root' })
export class ReelStore {
  private repository = inject<ReelRepository>(REEL_REPOSITORY);

  readonly reels = signal<SocialReel[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Memoria de sesión: lo que ya se pidió al servidor. Si el usuario sale y
   * vuelve a la pantalla, se pinta desde aquí con CERO peticiones.
   */
  readonly reelsCache = signal<SocialReel[]>([]);
  readonly myReactionsCache = new Map<string, string>();
  readonly guardadosCache = new Set<string>();
  readonly autoresCache = new Map<string, { nombre: string; avatar: string }>();
  readonly vistasCache = new Set<string>();
  paginaCache = 0;
  hayMasCache = false;

  loadReels(): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getReels().subscribe({
      next: (reels) => {
        this.reels.set(reels);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar reels');
        this.loading.set(false);
      },
    });
  }

  getReels(page?: number, size?: number): Observable<SocialReel[]> {
    return this.repository.getReels(page, size);
  }

  getReelsByUser(userId: string): Observable<SocialReel[]> {
    return this.repository.getReelsByUser(userId);
  }

  savedReels(userId: string): Observable<SocialReel[]> {
    return this.repository.savedReels(userId);
  }

  isReelSaved(userId: string, reelId: string): Observable<boolean> {
    return this.repository.isReelSaved(userId, reelId);
  }

  createReel(data: CreateReelRequest): Observable<SocialReel> {
    return this.repository.createReel(data);
  }

  updateReel(id: string, autorId: string, data: UpdateReelRequest): Observable<SocialReel> {
    return this.repository.updateReel(id, autorId, data);
  }

  deleteReel(id: string, autorId: string): Observable<boolean> {
    return this.repository.deleteReel(id, autorId);
  }

  saveReel(userId: string, reelId: string): Observable<boolean> {
    return this.repository.saveReel(userId, reelId);
  }

  unsaveReel(userId: string, reelId: string): Observable<boolean> {
    return this.repository.unsaveReel(userId, reelId);
  }

  incrementReelView(reelId: string, userId?: string): Observable<boolean> {
    return this.repository.incrementReelView(reelId, userId);
  }

  clear(): void {
    this.reels.set([]);
    this.error.set(null);
  }
}
