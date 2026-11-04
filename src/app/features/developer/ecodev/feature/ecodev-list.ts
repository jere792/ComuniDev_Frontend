import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EcodevStore } from '@features/developer/ecodev/data-access/state/ecodev.store';
import { SharedRightPanel } from '@features/shared/ui/right-panel/right-panel';
import {
  CATEGORIAS_EQUIPO,
  EcotechPost,
  EcotechTransaction,
  RecyclingPoint,
  categoriaLabel,
  condicionLabel,
  googleMapsLink,
  tipoMeta,
  txEstadoMeta,
  ubicacionDe,
} from '@features/developer/ecodev/domain/models/ecodev.model';

/**
 * Pantalla EcoDev (ODS 12): anuncios con filtros y paginación, más las
 * secciones de impacto, mis operaciones y puntos de reciclaje.
 */
@Component({
  selector: 'app-ecodev-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SharedRightPanel],
  templateUrl: './ecodev-list.html',
  styleUrl: './ecodev-list.scss',
})
export class EcodevList implements OnInit {
  readonly store = inject(EcodevStore);
  private readonly router = inject(Router);
  private readonly miUserId = localStorage.getItem('userId') ?? '';

  /** Pestaña activa: anuncios por defecto (operaciones y puntos no se pierden abajo). */
  readonly tab = signal<'anuncios' | 'operaciones' | 'puntos'>('anuncios');

  setTab(tab: 'anuncios' | 'operaciones' | 'puntos'): void {
    this.tab.set(tab);
  }

  readonly categorias = Object.entries(CATEGORIAS_EQUIPO);
  readonly tipos = Object.entries({
    DONACION: 'Donación',
    INTERCAMBIO: 'Intercambio',
    REPARACION: 'Reparación',
    REUTILIZACION: 'Reutilización',
    RECICLAJE: 'Reciclaje',
    CAMPANA: 'Campaña',
    CONSEJO_GREEN_IT: 'Consejo green IT',
  });

  tipoMeta = tipoMeta;
  categoriaLabel = categoriaLabel;
  condicionLabel = condicionLabel;
  ubicacionDe = ubicacionDe;
  txEstadoMeta = txEstadoMeta;
  googleMapsLink = googleMapsLink;

  ngOnInit(): void {
    this.store.loadPosts();
    this.store.loadRecyclingPoints();
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.store.loadImpacto(userId);
      this.store.loadMisOperaciones(userId);
    }
  }

  cambiarTipo(event: Event): void {
    this.store.setFiltroTipo((event.target as HTMLSelectElement).value);
  }

  cambiarCategoria(event: Event): void {
    this.store.setFiltroCategoria((event.target as HTMLSelectElement).value);
  }

  cargarMas(): void {
    this.store.loadMore();
  }

  abrirDetalle(post: EcotechPost): void {
    this.router.navigate([this.baseEcoDev, post.id]);
  }

  /** Base de rutas EcoDev segun el rol activo (/developer o /recruiter): el modulo es compartido. */
  get baseEcoDev(): string {
    return this.router.url.startsWith('/recruiter') ? '/recruiter/ecodev' : '/developer/ecodev';
  }

  portada(post: EcotechPost): string | null {
    return post.imagenes?.length ? post.imagenes[0] : null;
  }

  /** Fecha corta del anuncio (estilo feed). */
  fecha(valor: string | null): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return '';
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(fecha);
  }

  tituloDe(postId: string): string {
    return this.store.tituloDe(postId) || `Anuncio ${postId.slice(-6)}`;
  }

  verAnuncio(postId: string): void {
    this.router.navigate([this.baseEcoDev, postId]);
  }

  /** Estado de tu operación sobre un anuncio, para el badge de la tarjeta. */
  operacionDe(postId: string): { label: string; clase: string } | null {
    const tx = this.store.misOperaciones().find((t) => t.ecotechPostId === postId);
    if (!tx) return null;
    if (tx.estado === 'PENDIENTE_CONFIRMACION' || tx.estado === 'EN_DISPUTA') {
      return { label: 'En operación', clase: 'en-operacion' };
    }
    if (tx.estado === 'COMPLETADA') {
      return { label: 'Operación completada', clase: 'completada' };
    }
    return null;
  }

  puntoMaps(punto: RecyclingPoint): string | null {
    return googleMapsLink(punto.lat, punto.lng);
  }

  direccionDe(punto: RecyclingPoint): string {
    return [punto.direccion, punto.distrito, punto.ciudad].filter((parte) => !!parte?.trim()).join(' · ');
  }

  esMia(post: EcotechPost): boolean {
    return !!this.miUserId && post.autorId === this.miUserId;
  }

  soyEmisor(tx: EcotechTransaction): boolean {
    return !!this.miUserId && tx.emisorId === this.miUserId;
  }
}
