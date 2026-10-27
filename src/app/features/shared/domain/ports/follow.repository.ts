import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { FollowEdge } from '@features/shared/domain/models/follow.model';

/** Solicitud de seguir a un perfil privado (estilo Instagram). */
export interface FollowRequest {
  id: string;
  seguidorId: string;
  seguidoId: string;
  estado?: string;
  createdAt?: string;
}

export interface FollowRepository {
  follow(seguidorId: string, seguidoId: string): Observable<FollowEdge | null>;
  unfollow(seguidorId: string, seguidoId: string): Observable<boolean>;
  isFollowing(followerId: string, followedId: string): Observable<boolean>;
  /** Con size se pide una pagina (los mas recientes primero); page arranca en 0. */
  getFollowers(userId: string, page?: number, size?: number): Observable<FollowEdge[]>;
  getFollowing(userId: string, page?: number, size?: number): Observable<FollowEdge[]>;
  /** Solicitudes de seguir pendientes (perfiles privados) de un usuario. */
  getFollowRequests(userId: string): Observable<FollowRequest[]>;
  acceptFollowRequest(requestId: string): Observable<boolean>;
  rejectFollowRequest(requestId: string): Observable<boolean>;
}

export const FOLLOW_REPOSITORY = new InjectionToken<FollowRepository>('FollowRepository');
