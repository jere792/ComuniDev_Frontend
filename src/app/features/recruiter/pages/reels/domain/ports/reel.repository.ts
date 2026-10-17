import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialReel } from '@features/recruiter/pages/reels/domain/models/social-reel.model';

export interface CreateReelRequest {
  autorId: string;
  videoUrl: string;
  portadaUrl?: string;
  descripcion?: string;
  etiquetas?: string[];
  musica?: { titulo?: string; artista?: string };
  duracionSegundos?: number;
  visibilidad?: string;
}

export interface UpdateReelRequest {
  descripcion?: string;
  etiquetas?: string[];
  visibilidad?: string;
}

export interface ReelRepository {
  getReels(): Observable<SocialReel[]>;
  getReelsByUser(userId: string): Observable<SocialReel[]>;
  /** Los reels guardados por esa persona (marcador), del mas reciente al mas viejo. */
  savedReels(userId: string): Observable<SocialReel[]>;
  isReelSaved(userId: string, reelId: string): Observable<boolean>;
  createReel(data: CreateReelRequest): Observable<SocialReel>;
  /** Solo el autor puede editar su reel, por eso viaja `autorId`. */
  updateReel(id: string, autorId: string, data: UpdateReelRequest): Observable<SocialReel>;
  /** Solo el autor puede borrar su reel. */
  deleteReel(id: string, autorId: string): Observable<boolean>;
  saveReel(userId: string, reelId: string): Observable<boolean>;
  unsaveReel(userId: string, reelId: string): Observable<boolean>;
  /** Suma una vista; el autor no se cuenta a si mismo. */
  incrementReelView(reelId: string, userId?: string): Observable<boolean>;
}

export const REEL_REPOSITORY = new InjectionToken<ReelRepository>('ReelRepository');
