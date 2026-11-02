import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointsStore } from '@features/developer/gamificacion/data-access/state/points.store';
import {
  UserPoints,
  rangoColor,
  rangoEmoji,
  rangoNombre,
} from '@features/developer/gamificacion/domain/models/points.model';

/** Nivel máximo de la progresión (10 niveles por rango, 5 rangos). */
const NIVEL_MAXIMO = 50;

/**
 * Tarjeta de progreso del perfil: rango con emoji, nivel, barra de avance,
 * puntos que faltan y desglose por categoría.
 */
@Component({
  selector: 'app-points-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './points-card.html',
  styleUrl: './points-card.scss',
})
export class PointsCard {
  private readonly store = inject(PointsStore);

  readonly points = this.store.points;
  readonly loading = this.store.loading;
  readonly nivelMaximo = NIVEL_MAXIMO;

  rangoEmoji = rangoEmoji;
  rangoColor = rangoColor;
  rangoNombre = rangoNombre;

  /** Avance [0..1] del backend convertido a porcentaje para la barra. */
  porcentaje(pts: UserPoints): number {
    const avance = Number.isFinite(pts.progresoNivel) ? pts.progresoNivel : 0;
    return Math.min(Math.max(avance, 0), 1) * 100;
  }
}
