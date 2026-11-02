import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Badge,
  PointTransaction,
  RankingPosicion,
  UserBadge,
  UserPoints,
} from '@features/developer/gamificacion/domain/models/points.model';

export interface PointsRepository {
  /** Puntos, nivel y rango; el backend devuelve saldo en cero si nunca ganó puntos. */
  userPoints(userId: string): Observable<UserPoints | null>;
  /** Top de usuarios por puntos totales. */
  rankingPoints(size?: number): Observable<RankingPosicion[]>;
  /** Catálogo completo de insignias. */
  badgesCatalog(): Observable<Badge[]>;
  /** Insignias ya desbloqueadas por el usuario. */
  userBadges(userId: string): Observable<UserBadge[]>;
  /** Historial de movimientos de puntos (página 0 por defecto). */
  pointsHistory(userId: string, page?: number, size?: number): Observable<PointTransaction[]>;
}

export const POINTS_REPOSITORY = new InjectionToken<PointsRepository>('PointsRepository');
