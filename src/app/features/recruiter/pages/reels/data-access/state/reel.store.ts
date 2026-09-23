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

  getReels(): Observable<SocialReel[]> {
    return this.repository.getReels();
  }

  getReelsByUser(userId: string): Observable<SocialReel[]> {
    return this.repository.getReelsByUser(userId);
  }

  createReel(data: CreateReelRequest): Observable<SocialReel> {
    return this.repository.createReel(data);
  }

  updateReel(id: string, data: UpdateReelRequest): Observable<SocialReel> {
    return this.repository.updateReel(id, data);
  }

  deleteReel(id: string): Observable<boolean> {
    return this.repository.deleteReel(id);
  }

  clear(): void {
    this.reels.set([]);
    this.error.set(null);
  }
}
