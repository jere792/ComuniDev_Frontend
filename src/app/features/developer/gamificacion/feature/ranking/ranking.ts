import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PointsStore } from '@features/developer/gamificacion/data-access/state/points.store';
import {
  RankingPosicion,
  rangoColor,
  rangoEmoji,
  rangoNombre,
} from '@features/developer/gamificacion/domain/models/points.model';

/** Top de usuarios por puntos: posición con medalla, rango, nivel y total. */
@Component({
  selector: 'app-developer-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking.html',
  styleUrl: './ranking.scss',
})
export class DeveloperRanking implements OnInit {
  private readonly store = inject(PointsStore);
  private readonly router = inject(Router);
  private readonly miUserId = localStorage.getItem('userId');

  readonly ranking = this.store.ranking;
  readonly loading = this.store.rankingLoading;
  readonly error = this.store.rankingError;

  rangoEmoji = rangoEmoji;
  rangoColor = rangoColor;
  rangoNombre = rangoNombre;

  ngOnInit(): void {
    this.store.loadRanking(20);
  }

  /** 🥇🥈🥉 en el podio, el resto con su posición. */
  medalla(posicion: number): string {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    return `${posicion}°`;
  }

  esYo(row: RankingPosicion): boolean {
    return !!row.puntos.userId && row.puntos.userId === this.miUserId;
  }

  abrirPerfil(row: RankingPosicion): void {
    if (row.puntos.userId) this.router.navigate(['/profile', row.puntos.userId]);
  }

  iniciales(nombre: string | null): string {
    return (nombre ?? '?')
      .split(' ')
      .filter(Boolean)
      .map((parte) => parte[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
