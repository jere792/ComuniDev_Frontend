import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  Badge,
  BadgeEstado,
  PointTransaction,
  RankingPosicion,
  UserBadge,
  UserPoints,
} from '@features/developer/gamificacion/domain/models/points.model';
import { POINTS_REPOSITORY, PointsRepository } from '@features/developer/gamificacion/domain/ports/points.repository';

@Injectable({ providedIn: 'root' })
export class PointsStore {
  private repository = inject<PointsRepository>(POINTS_REPOSITORY);

  readonly points = signal<UserPoints | null>(null);
  readonly badgesCatalog = signal<Badge[]>([]);
  readonly userBadges = signal<UserBadge[]>([]);
  readonly ranking = signal<RankingPosicion[]>([]);
  readonly history = signal<PointTransaction[]>([]);

  readonly loading = signal(false);
  readonly rankingLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rankingError = signal<string | null>(null);

  /** Catálogo con el desbloqueo de cada insignia para el usuario actual. */
  readonly badges = computed<BadgeEstado[]>(() => {
    const obtenidas = new Map(this.userBadges().map((badge) => [badge.codigo, badge]));
    return this.badgesCatalog().map((badge) => {
      const obtenida = obtenidas.get(badge.codigo);
      return {
        ...badge,
        desbloqueada: !!obtenida,
        obtenidaEn: obtenida?.obtenidaEn ?? null,
      };
    });
  });

  readonly desbloqueadas = computed(() => this.badges().filter((badge) => badge.desbloqueada));

  /** Saldo + catálogo + insignias del perfil, en una sola tanda. */
  loadProfile(userId: string): void {
    if (!userId || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      points: this.repository.userPoints(userId),
      catalog: this.repository.badgesCatalog(),
      badges: this.repository.userBadges(userId),
    }).subscribe({
      next: ({ points, catalog, badges }) => {
        this.points.set(points);
        this.badgesCatalog.set(catalog);
        this.userBadges.set(badges);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu progreso');
        this.loading.set(false);
      },
    });
  }

  loadRanking(size = 20): void {
    if (this.rankingLoading()) return;
    this.rankingLoading.set(true);
    this.rankingError.set(null);
    this.repository.rankingPoints(size).subscribe({
      next: (ranking) => {
        this.ranking.set(ranking);
        this.rankingLoading.set(false);
      },
      error: () => {
        this.rankingError.set('No se pudo cargar el ranking');
        this.rankingLoading.set(false);
      },
    });
  }

  loadHistory(userId: string, page = 0, size = 20): void {
    this.repository.pointsHistory(userId, page, size).subscribe({
      next: (history) => this.history.set(history),
      error: () => this.history.set([]),
    });
  }

  clear(): void {
    this.points.set(null);
    this.badgesCatalog.set([]);
    this.userBadges.set([]);
    this.ranking.set([]);
    this.history.set([]);
    this.error.set(null);
    this.rankingError.set(null);
  }
}
