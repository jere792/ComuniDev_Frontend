import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, forkJoin, map, tap } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import {
  EcotechImpacto,
  EcotechPost,
  EcotechPostInput,
  EcotechTransaction,
  EcotechTransactionEvent,
  RecyclingPoint,
} from '@features/developer/ecodev/domain/models/ecodev.model';
import { ECODEV_REPOSITORY, EcotechRepository } from '@features/developer/ecodev/domain/ports/ecodev.repository';

const PAGE_SIZE = 12;

/**
 * Estado de la pantalla EcoDev: listado paginado con filtros, detalle,
 * mis operaciones, puntos de reciclaje e impacto. Las mutaciones devuelven
 * el observable para que la página muestre el toast, y aquí solo se
 * refresca el estado local.
 */
@Injectable({ providedIn: 'root' })
export class EcodevStore {
  private repository = inject<EcotechRepository>(ECODEV_REPOSITORY);
  private readonly toast = inject(ToastService);

  readonly posts = signal<EcotechPost[]>([]);
  readonly page = signal(0);
  readonly hasMore = signal(true);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);

  readonly filtroTipo = signal<string>('');
  readonly filtroCategoria = signal<string>('');

  readonly detail = signal<EcotechPost | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  readonly misOperaciones = signal<EcotechTransaction[]>([]);
  readonly operacionesLoading = signal(false);
  /** Título de cada anuncio referenciado por una transacción (id -> título). */
  readonly postTitles = signal<Record<string, string>>({});

  readonly recyclingPoints = signal<RecyclingPoint[]>([]);
  readonly puntosLoading = signal(false);

  readonly impacto = signal<EcotechImpacto | null>(null);

  /** Transacción viva del usuario sobre el anuncio del detalle (si hay). */
  readonly miTransaccion = computed<EcotechTransaction | null>(() => {
    const post = this.detail();
    if (!post) return null;
    const userId = this.userId();
    return (
      this.misOperaciones().find(
        (tx) => tx.ecotechPostId === post.id && (tx.emisorId === userId || tx.receptorId === userId),
      ) ?? null
    );
  });

  /** Suscripción única a `ecotechTransactionUpdated` (lista y detalle la comparten). */
  private suscripcionTx: Subscription | null = null;
  private usuarioTxEscuchando: string | null = null;
  /** Ids ya recargados para no repetir la carga si el evento no llega a la lista. */
  private readonly txRecargadas = new Set<string>();

  // ------------------------------------------------------------- listado

  /** Primera página con los filtros actuales. */
  loadPosts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(0);
    this.hasMore.set(true);
    this.repository
      .ecotechPosts({
        tipo: this.filtroTipo() || undefined,
        categoriaEquipo: this.filtroCategoria() || undefined,
        page: 0,
        size: PAGE_SIZE,
      })
      .subscribe({
        next: (posts) => {
          this.posts.set(posts);
          this.page.set(0);
          this.hasMore.set(posts.length >= PAGE_SIZE);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No se pudieron cargar los anuncios EcoDev');
          this.loading.set(false);
        },
      });
  }

  /** Siguiente página; solo lectura mientras haya más. */
  loadMore(): void {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;
    const siguiente = this.page() + 1;
    this.loadingMore.set(true);
    this.repository
      .ecotechPosts({
        tipo: this.filtroTipo() || undefined,
        categoriaEquipo: this.filtroCategoria() || undefined,
        page: siguiente,
        size: PAGE_SIZE,
      })
      .subscribe({
        next: (posts) => {
          this.posts.update((actual) => [...actual, ...posts]);
          this.page.set(siguiente);
          this.hasMore.set(posts.length >= PAGE_SIZE);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false),
      });
  }

  setFiltroTipo(tipo: string): void {
    if (this.filtroTipo() === tipo) return;
    this.filtroTipo.set(tipo);
    this.loadPosts();
  }

  setFiltroCategoria(categoria: string): void {
    if (this.filtroCategoria() === categoria) return;
    this.filtroCategoria.set(categoria);
    this.loadPosts();
  }

  // ------------------------------------------------------------- detalle

  loadDetail(id: string): void {
    this.detailLoading.set(true);
    this.detailError.set(null);
    this.detail.set(null);
    this.repository.ecotechPost(id).subscribe({
      next: (post) => {
        this.detail.set(post);
        this.detailLoading.set(false);
        if (!post) this.detailError.set('No se encontró el anuncio');
      },
      error: () => {
        this.detailError.set('No se pudo cargar el anuncio');
        this.detailLoading.set(false);
      },
    });
  }

  /** Transacciones del usuario sobre un anuncio: es su estado en el detalle. */
  loadTransaccionesDelPost(postId: string, userId: string): void {
    if (!userId) return;
    this.repository.ecotechTransactions({ postId, userId }).subscribe({
      next: (transacciones) => {
        // la más reciente manda si repitieron intentos
        this.misOperaciones.update((actual) => {
          const resto = actual.filter((tx) => tx.ecotechPostId !== postId);
          return [...transacciones, ...resto];
        });
      },
      error: () => undefined,
    });
  }

  // ------------------------------------------------------- mis operaciones

  loadMisOperaciones(userId: string): void {
    if (!userId || this.operacionesLoading()) return;
    this.operacionesLoading.set(true);
    this.repository.ecotechTransactions({ userId }).subscribe({
      next: (transacciones) => {
        this.misOperaciones.set(transacciones);
        this.operacionesLoading.set(false);
        this.resolverTitulos(transacciones);
      },
      error: () => {
        this.operacionesLoading.set(false);
      },
    });
  }

  /**
   * Canal de tiempo real de las transacciones: una sola suscripción por
   * usuario, compartida por "Mis operaciones" y el detalle del anuncio.
   */
  escucharTransacciones(userId: string): void {
    if (this.usuarioTxEscuchando === userId && this.suscripcionTx && !this.suscripcionTx.closed) return;

    this.suscripcionTx?.unsubscribe();
    this.usuarioTxEscuchando = userId;
    this.suscripcionTx = this.repository.ecotechTransactionUpdated(userId).subscribe({
      next: (event) => this.aplicarEventoTransaccion(event, userId),
      error: () => {},
    });
  }

  /** Refleja el evento en la operación (y en el detalle) sin recargar la lista. */
  private aplicarEventoTransaccion(event: EcotechTransactionEvent, userId: string): void {
    const actual = this.misOperaciones().find((tx) => tx.id === event.transactionId);

    if (!actual) {
      if (!this.operacionesLoading() && !this.txRecargadas.has(event.transactionId)) {
        this.txRecargadas.add(event.transactionId);
        this.loadMisOperaciones(userId);
      }
      return;
    }

    const sinCambios =
      actual.estado === event.estado &&
      actual.confirmadoPorEmisor === event.confirmadoPorEmisor &&
      actual.confirmadoPorReceptor === event.confirmadoPorReceptor;
    // La mutación propia y el evento del canal traen el mismo cambio: no se duplica.
    if (sinCambios) return;

    const eraPendiente = actual.estado === 'PENDIENTE_CONFIRMACION';

    this.misOperaciones.update((lista) =>
      lista.map((tx) =>
        tx.id === event.transactionId
          ? {
              ...tx,
              estado: event.estado,
              confirmadoPorEmisor: event.confirmadoPorEmisor,
              confirmadoPorReceptor: event.confirmadoPorReceptor,
              fechaCompletado:
                event.estado === 'COMPLETADA' ? event.updatedAt ?? tx.fechaCompletado : tx.fechaCompletado,
            }
          : tx,
      ),
    );

    // La acción la hizo el propio usuario: su pantalla ya mostró el resultado.
    if (event.actorId === userId) return;

    if (event.estado === 'COMPLETADA') {
      this.toast.success('Operación completada');
    } else if (event.estado === 'CANCELADA' || event.estado === 'RECHAZADA') {
      this.toast.info('Operación cancelada');
    } else if (event.estado === 'EN_DISPUTA') {
      this.toast.warning('La operación entró en disputa');
    } else if (
      eraPendiente &&
      event.estado === 'PENDIENTE_CONFIRMACION' &&
      (event.confirmadoPorEmisor || event.confirmadoPorReceptor)
    ) {
      this.toast.info('La otra parte confirmó la entrega');
    }
  }

  /** Trae el título de cada anuncio distinto citado por las transacciones. */
  private resolverTitulos(transacciones: EcotechTransaction[]): void {
    const ids = [...new Set(transacciones.map((tx) => tx.ecotechPostId).filter(Boolean))];
    if (!ids.length) return;
    const conocidos = this.postTitles();
    const faltantes = ids.filter((id) => !(id in conocidos));
    if (!faltantes.length) return;

    forkJoin(faltantes.map((id) => this.repository.ecotechPost(id).pipe(map((post) => [id, post] as const)))).subscribe(
      (entradas) => {
        const titulos: Record<string, string> = { ...this.postTitles() };
        for (const [id, post] of entradas) {
          if (post) titulos[id] = post.titulo;
        }
        this.postTitles.set(titulos);
      },
    );
  }

  tituloDe(postId: string): string {
    return this.postTitles()[postId] ?? '';
  }

  // --------------------------------------------------------- mutaciones

  createPost(autorId: string, input: EcotechPostInput): Observable<EcotechPost | null> {
    return this.repository.createEcotechPost(autorId, input).pipe(
      tap((post) => {
        if (post) this.posts.update((actual) => [post, ...actual]);
      }),
    );
  }

  contact(postId: string, userId: string): Observable<EcotechPost | null> {
    return this.repository.contactEcotechPost(postId, userId).pipe(
      tap((post) => {
        if (post) this.reemplazarPost(post);
      }),
    );
  }

  startTransaction(postId: string, emisorId: string): Observable<EcotechTransaction | null> {
    return this.repository.startEcotechTransaction(postId, emisorId).pipe(
      tap((tx) => {
        if (tx) this.misOperaciones.update((actual) => [tx, ...actual.filter((t) => t.id !== tx.id)]);
      }),
    );
  }

  confirmTransaction(transactionId: string, userId: string): Observable<EcotechTransaction | null> {
    return this.repository.confirmEcotechTransaction(transactionId, userId).pipe(
      tap((tx) => {
        if (tx) this.actualizarTransaccion(tx);
      }),
    );
  }

  cancelTransaction(transactionId: string, userId: string): Observable<EcotechTransaction | null> {
    return this.repository.cancelEcotechTransaction(transactionId, userId).pipe(
      tap((tx) => {
        if (tx) this.actualizarTransaccion(tx);
      }),
    );
  }

  private actualizarTransaccion(tx: EcotechTransaction): void {
    this.misOperaciones.update((actual) => actual.map((t) => (t.id === tx.id ? tx : t)));
  }

  private reemplazarPost(post: EcotechPost): void {
    this.posts.update((actual) => actual.map((p) => (p.id === post.id ? post : p)));
    if (this.detail()?.id === post.id) this.detail.set(post);
  }

  // --------------------------------------------------- puntos e impacto

  loadRecyclingPoints(): void {
    if (this.puntosLoading()) return;
    this.puntosLoading.set(true);
    this.repository.recyclingPoints(true).subscribe({
      next: (puntos) => {
        this.recyclingPoints.set(puntos);
        this.puntosLoading.set(false);
      },
      error: () => this.puntosLoading.set(false),
    });
  }

  loadImpacto(userId: string): void {
    if (!userId) return;
    this.repository.ecotechImpacto(userId).subscribe({
      next: (impacto) => this.impacto.set(impacto),
      error: () => this.impacto.set(null),
    });
  }

  private userId(): string {
    return localStorage.getItem('userId') ?? '';
  }

  clear(): void {
    this.suscripcionTx?.unsubscribe();
    this.suscripcionTx = null;
    this.usuarioTxEscuchando = null;
    this.txRecargadas.clear();
    this.posts.set([]);
    this.detail.set(null);
    this.misOperaciones.set([]);
    this.recyclingPoints.set([]);
    this.impacto.set(null);
    this.postTitles.set({});
    this.error.set(null);
    this.detailError.set(null);
  }
}
