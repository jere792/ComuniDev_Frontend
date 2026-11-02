import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PointsStore } from '@features/developer/gamificacion/data-access/state/points.store';

/**
 * Grilla de insignias del perfil: las desbloqueadas a color completo y las
 * pendientes en gris con candado; el título muestra la descripción.
 */
@Component({
  selector: 'app-badges-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badges-grid.html',
  styleUrl: './badges-grid.scss',
})
export class BadgesGrid {
  private readonly store = inject(PointsStore);

  readonly badges = this.store.badges;
  readonly loading = this.store.loading;
  readonly desbloqueadas = computed(() => this.store.desbloqueadas().length);
}
