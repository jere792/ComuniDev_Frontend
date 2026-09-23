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
  createReel(data: CreateReelRequest): Observable<SocialReel>;
  updateReel(id: string, data: UpdateReelRequest): Observable<SocialReel>;
  deleteReel(id: string): Observable<boolean>;
}

export const REEL_REPOSITORY = new InjectionToken<ReelRepository>('ReelRepository');
