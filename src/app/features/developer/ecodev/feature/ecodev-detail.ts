import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { EcodevStore } from '@features/developer/ecodev/data-access/state/ecodev.store';
import {
  categoriaLabel,
  condicionLabel,
  googleMapsLink,
  tipoMeta,
  txEstadoMeta,
  ubicacionDe,
} from '@features/developer/ecodev/domain/models/ecodev.model';

/** Detalle de un anuncio EcoDev: fotos, advertencia, ubicación y coordinación. */
@Component({
  selector: 'app-ecodev-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModal],
  templateUrl: './ecodev-detail.html',
  styleUrl: './ecodev-detail.scss',
})
export class EcodevDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Base de rutas EcoDev segun el rol activo (/developer o /recruiter). */
  get baseEcoDev(): string {
    return this.router.url.startsWith('/recruiter') ? '/recruiter/ecodev' : '/developer/ecodev';
  }
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);
  readonly store = inject(EcodevStore);

  readonly post = this.store.detail;
  readonly loading = this.store.detailLoading;
  readonly error = this.store.detailError;
  readonly transaccion = this.store.miTransaccion;

  readonly fotoActiva = signal(0);
  readonly enviando = signal(false);
  readonly cancelOpen = signal(false);

  readonly miUserId = localStorage.getItem('userId') ?? '';

  tipoMeta = tipoMeta;
  categoriaLabel = categoriaLabel;
  condicionLabel = condicionLabel;
  txEstadoMeta = txEstadoMeta;
  ubicacionDe = ubicacionDe;

  /** Es tu anuncio: no puedes interesarte ni coordinar sobre él. */
  readonly esMia = computed(() => {
    const post = this.post();
    return !!post && !!this.miUserId && post.autorId === this.miUserId;
  });

  readonly activo = computed(() => this.post()?.estado === 'ACTIVA');

  /** Ya marcaste interés: el backend no duplica el contador ni repite el aviso. */
  readonly yaInteresado = computed(() => {
    const post = this.post();
    return !!post?.interesados?.some((persona) => persona.id === this.miUserId);
  });

  /** Ya hay una operación viva tuya sobre este anuncio. */
  readonly conTransaccion = computed(() => {
    const tx = this.transaccion();
    return !!tx && (tx.estado === 'PENDIENTE_CONFIRMACION' || tx.estado === 'EN_DISPUTA');
  });

  readonly mapsLink = computed(() => {
    const post = this.post();
    return post ? googleMapsLink(post.lat, post.lng) : null;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) {
      this.store.detailError.set('No se encontró el anuncio');
      this.store.detailLoading.set(false);
      return;
    }
    this.store.loadDetail(id);
    if (this.miUserId) {
      this.store.escucharTransacciones(this.miUserId);
      this.store.loadTransaccionesDelPost(id, this.miUserId);
    }
  }

  // ------------------------------------------------------------- acciones

  /** "Me interesa": avisa al autor y suma un interesado. */
  marcarInteres(): void {
    const post = this.post();
    if (!post || !this.miUserId) {
      this.toast.error('Inicia sesión para interesarte por el anuncio');
      return;
    }
    this.enviando.set(true);
    this.store.contact(post.id, this.miUserId).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        if (resultado) {
          this.toast.success('El autor recibirá tu interés. ¡Coordina por el chat!');
          // refresca la lista de interesados del detalle
          this.store.loadDetail(post.id);
        }
      },
      error: () => {
        this.enviando.set(false);
        this.toast.error('No se pudo registrar tu interés');
      },
    });
  }

  /** Abre el chat interno con el autor del anuncio (misma ruta que usa el perfil). */
  conversar(): void {
    const post = this.post();
    if (post) this.conversarCon(post.autorId);
  }

  /** Abre el chat interno con una persona concreta. */
  conversarCon(userId: string): void {
    if (!userId) return;
    const base = this.router.url.startsWith('/recruiter') ? '/recruiter' : '/developer';
    this.router.navigate([base, 'messages'], { queryParams: { user: userId } });
  }

  /** "Coordinar operación": inicia la transacción con el autor del anuncio. */
  coordinar(): void {
    const post = this.post();
    if (!post || !this.miUserId) {
      this.toast.error('Inicia sesión para coordinar la operación');
      return;
    }
    this.enviando.set(true);
    this.store.startTransaction(post.id, this.miUserId).subscribe({
      next: (tx) => {
        this.enviando.set(false);
        if (tx) this.toast.success('Operación iniciada: el autor debe confirmar la entrega');
      },
      error: (err) => {
        this.enviando.set(false);
        this.toast.error(err?.error?.message ?? 'No se pudo iniciar la operación');
      },
    });
  }

  confirmarEntrega(): void {
    const tx = this.transaccion();
    if (!tx || !this.miUserId) return;
    this.enviando.set(true);
    this.store.confirmTransaction(tx.id, this.miUserId).subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        if (resultado) {
          this.toast.success(
            resultado.estado === 'COMPLETADA'
              ? '¡Entrega confirmada por ambas partes!'
              : 'Confirmación registrada: falta la otra parte',
          );
        }
      },
      error: () => {
        this.enviando.set(false);
        this.toast.error('No se pudo confirmar la entrega');
      },
    });
  }

  pedirCancelacion(): void {
    this.cancelOpen.set(true);
  }

  cancelarOperacion(): void {
    const tx = this.transaccion();
    this.cancelOpen.set(false);
    if (!tx || !this.miUserId) return;
    this.store.cancelTransaction(tx.id, this.miUserId).subscribe({
      next: (resultado) => {
        if (resultado) this.toast.info('Operación cancelada');
      },
      error: () => this.toast.error('No se pudo cancelar la operación'),
    });
  }

  // --------------------------------------------------------------- fotos

  seleccionarFoto(indice: number): void {
    this.fotoActiva.set(indice);
  }

  fotoActual(): string | null {
    const imagenes = this.post()?.imagenes ?? [];
    if (!imagenes.length) return null;
    return imagenes[Math.min(this.fotoActiva(), imagenes.length - 1)];
  }

  /** "Ciudad · Distrito" del anuncio, o un texto por defecto. */
  ubicacionLarga(): string {
    const post = this.post();
    if (!post) return '';
    return [post.ciudad, post.distrito].filter((parte) => !!parte?.trim()).join(' · ') || 'Sin ubicación registrada';
  }

  // ------------------------------------------------------------- varios

  vuelve(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate([this.baseEcoDev]);
    }
  }
}
