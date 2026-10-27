import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReelStore } from '@features/recruiter/pages/reels/data-access/state/reel.store';
import { ReactionStore } from '@features/shared/data-access/state/reaction.store';
import { CommentStore } from '@features/shared/data-access/state/comment.store';
import { SocialReel } from '@features/recruiter/pages/reels/domain/models/social-reel.model';
import { TipoReaccion } from '@features/shared/domain/models/social-reaction.model';
import { SocialComment } from '@features/shared/domain/models/social-comment.model';
import { UserStore } from '@features/users/data-access/state/user.store';
import { ToastService } from '@core/services/toast.service';
import { ReportService } from '@core/services/report.service';
import { UploadService } from '@core/services/upload.service';
import { TagInputComponent } from '@shared/ui/tag-input/tag-input';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { ReportModal, ReportPayload } from '@shared/ui/report-modal/report-modal';

interface ReelVM {
  reel: SocialReel;
  autorNombre: string;
  autorAvatar: string;
  myReaction: TipoReaccion | null;
  saved: boolean;
  showComments: boolean;
  comments: ReelCommentVM[];
  newComment: string;
  /** Para no contar la vista dos veces si vuelve a entrar al mismo reel. */
  vistaContada: boolean;
}

interface ReelCommentVM {
  comment: SocialComment;
  autorNombre: string;
  autorAvatar: string;
  /** Corazón que yo dejé en este comentario (LIKE o null). */
  myReaction: TipoReaccion | null;
  likesCount: number;
  replies: ReelCommentVM[];
  repliesCount: number;
  repliesLoaded: boolean;
  showReplies: boolean;
  replyText: string;
  showReplyInput: boolean;
}

@Component({
  selector: 'app-recruiter-reels',
  imports: [FormsModule, DatePipe, ConfirmModal, ReportModal, TagInputComponent],
  templateUrl: './reels.html',
  styleUrl: './reels.scss',
})
export class RecruiterReels implements OnInit {
  private reelService = inject(ReelStore);
  /** Mismo store (singleton) con el nombre con el que se leen sus caches de sesión. */
  private reelStore = inject(ReelStore);
  private reactionService = inject(ReactionStore);
  private commentService = inject(CommentStore);
  private userStore = inject(UserStore);
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private reportService = inject(ReportService);

  reels = signal<ReelVM[]>([]);
  currentIndex = 0;
  /** Ventana del feed: paginas de 10; al acercarse al final se trae la siguiente sola. */
  private pagina = 0;
  private hayMas = false;
  private cargandoPagina = false;
  private static readonly TAMANO = 10;
  loading = signal(true);
  deleteConfirmOpen = signal(false);
  pendingDeleteId = signal<string | null>(null);
  /** Comentario que se está reportando (null = modal cerrado). */
  reportTarget: ReelCommentVM | null = null;

  // Reproducción del video (barra de progreso estilo TikTok)
  currentTime = 0;
  duration = 0;
  /** Volumen en porcentaje (0-100) para la barra de rango. */
  volume = 100;
  /** Autoplay arranca cada video en silencio. */
  muted = true;
  private draggingSeek = false;
  /** Bloqueo para no saltar de reel a cada tick del scroll. */
  private wheelLocked = false;

  // Composer
  showComposer = signal(false);
  reelDescripcion = '';
  reelEtiquetas: string[] = [];
  creating = false;
  /** Archivo elegido para subir; se sube al backend al publicar. */
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = '';

  /** Nombre y foto del usuario logueado, para firmar sus comentarios sin inventarlos. */
  private myName = 'Tú';
  private myAvatar = '';

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  ngOnInit(): void {
    const me = this.getUserId();
    if (me) this.loadMyName(me);

    this.cargarPagina(0);
  }

  /**
   * Trae una ventana de reels (10). La pagina 0 reemplaza la lista; las demas
   * se agregan al final. Al acercarse al ultimo reel del feed se pide la
   * siguiente sola, sin boton: el pager sigue siendo infinito.
   */
  private cargarPagina(pagina: number): void {
    // segunda visita: todo en memoria, CERO peticiones al servidor
    if (pagina === 0 && this.reelStore.reelsCache().length > 0) {
      this.reels.set(this.reelStore.reelsCache().map(r => this.buildVm(r)));
      this.pagina = this.reelStore.paginaCache;
      this.hayMas = this.reelStore.hayMasCache;
      this.loading.set(false);
      this.aplicarCaches();
      this.registrarVistaActual();
      return;
    }

    if (this.cargandoPagina) return;
    this.cargandoPagina = true;

    this.reelService.getReels(pagina, RecruiterReels.TAMANO).subscribe({
      next: (data: SocialReel[]) => {
        this.pagina = pagina;
        this.hayMas = data.length >= RecruiterReels.TAMANO;
        this.cargandoPagina = false;

        // lo pedido queda en la memoria del store para las proximas visitas
        if (pagina === 0) {
          this.reelStore.reelsCache.set(data);
        } else {
          this.reelStore.reelsCache.update(actual => [...actual, ...data]);
        }
        this.reelStore.paginaCache = this.pagina;
        this.reelStore.hayMasCache = this.hayMas;

        const vms = data.map(r => this.buildVm(r));
        if (pagina === 0) {
          this.reels.set(vms);
          this.loading.set(false);
          // El reel que queda a la vista al entrar tambien cuenta como vista.
          this.registrarVistaActual();
        } else {
          this.reels.update(list => [...list, ...vms]);
        }
        // de la pagina nueva: autores en 1 peticion, reacciones en 1 y guardados en 1
        this.cargarAutores(data.map(r => r.autorId));
        this.loadMyReactions(data);
        this.loadSavedState(data);
      },
      error: () => {
        this.cargandoPagina = false;
        this.loading.set(false);
      },
    });
  }

  /** Pinta desde la memoria lo que ya se pidio: reaccion, guardado, autor y vistas. */
  private aplicarCaches(): void {
    this.reels.update(list => list.map(vm => ({
      ...vm,
      myReaction: (this.reelStore.myReactionsCache.get(vm.reel.id) ?? null) as TipoReaccion | null,
      saved: this.reelStore.guardadosCache.has(vm.reel.id),
      vistaContada: this.reelStore.vistasCache.has(vm.reel.id),
    })));
    this.cargarAutores([...new Set(this.reels().map(vm => vm.reel.autorId))]);
  }

  private buildVm(reel: SocialReel): ReelVM {
    return {
      reel,
      autorNombre: '',
      autorAvatar: '',
      myReaction: null,
      saved: false,
      showComments: false,
      comments: [],
      newComment: '',
      vistaContada: false,
    };
  }

  private loadMyName(userId: string): void {
    this.userStore.getById(userId).subscribe({
      next: (user: any) => {
        if (user?.nombre) this.myName = user.nombre;
        if (user?.fotoPerfilUrl) this.myAvatar = user.fotoPerfilUrl;
      },
      error: () => {}
    });
  }

  /**
   * Autores de varios reels en UNA sola consulta (aliases u0, u1...) con lo que
   * falte en cache; antes era un user(id) por reel. Lo que ya esta en cache se
   * aplica de una.
   */
  private cargarAutores(autorIds: string[]): void {
    const pedidos = [...new Set(autorIds)].filter(id => !!id);
    const faltantes = pedidos.filter(id => !this.reelStore.autoresCache.has(id));

    const aplicar = () => pedidos.forEach(id => {
      const info = this.reelStore.autoresCache.get(id);
      if (info) this.applyAuthor(id, info);
    });

    if (faltantes.length === 0) {
      aplicar();
      return;
    }

    this.userStore.getByIds(faltantes).subscribe({
      next: (usuarios: any[]) => {
        usuarios.forEach(u => {
          if (u?.id) this.reelStore.autoresCache.set(u.id, { nombre: u.nombre ?? 'Usuario', avatar: u.fotoPerfilUrl ?? '' });
        });
        aplicar();
      },
      // sin autores quedan los placeholders con "Usuario"
      error: () => {}
    });
  }

  private applyAuthor(autorId: string, info: { nombre: string; avatar: string }): void {
    this.reels.update(list => list.map(vm => {
      if (vm.reel.autorId === autorId) {
        return { ...vm, autorNombre: info.nombre, autorAvatar: info.avatar };
      }
      return vm;
    }));
  }

  private loadMyReactions(reels: SocialReel[]): void {
    const userId = this.getUserId();
    if (!userId || reels.length === 0) return;

    // una sola peticion para todos los reels (antes: una por reel)
    this.reactionService.getMyReactions(userId, 'REEL', reels.map(r => r.id)).subscribe({
      next: (reacciones) => {
        reacciones.forEach(r => {
          if (r.tipoReaccion && r.objetivoId) {
            this.reelStore.myReactionsCache.set(r.objetivoId, r.tipoReaccion);
          }
        });
        this.reels.update(list => list.map(vm => {
          const tipo = this.reelStore.myReactionsCache.get(vm.reel.id);
          return tipo ? { ...vm, myReaction: tipo as TipoReaccion } : vm;
        }));
      },
      error: () => {}
    });
  }

  /** Consulta al backend cuales de estos reels ya tiene guardados el usuario. */
  private loadSavedState(reels: SocialReel[]): void {
    const userId = this.getUserId();
    if (!userId || reels.length === 0) return;
    const visibles = reels.map(r => r.id);

    // una sola peticion: devuelve todos mis reels guardados (antes: una por reel)
    this.reelService.savedReels(userId).subscribe({
      next: (guardados) => {
        const ids = new Set(guardados.map(g => g.id));
        visibles.forEach(id => {
          if (ids.has(id)) this.reelStore.guardadosCache.add(id);
          else this.reelStore.guardadosCache.delete(id);
        });
        this.reels.update(list => list.map(vm =>
          visibles.includes(vm.reel.id) ? { ...vm, saved: ids.has(vm.reel.id) } : vm
        ));
      },
      error: () => {}
    });
  }

  // ─── Composer ───

  toggleComposer(): void {
    this.showComposer.update(v => !v);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !file.type.startsWith('video/')) {
      this.toast.error('El archivo debe ser un video');
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  createReel(): void {
    const userId = this.getUserId();
    if (!userId || !this.selectedFile) return;

    this.creating = true;
    this.uploading = true;
    this.uploadProgress = 'Subiendo video...';

    // el video se sube al backend (Cloudinary) y con la url resultante se crea el reel
    this.uploadService.uploadFile(this.selectedFile).subscribe({
      next: (uploaded) => {
        this.uploadProgress = 'Publicando...';
        this.publishReel(userId, uploaded.url);
      },
      error: () => {
        this.uploading = false;
        this.creating = false;
        this.uploadProgress = '';
        this.toast.error('No se pudo subir el video');
      }
    });
  }

  private publishReel(userId: string, videoUrl: string): void {
    this.reelService.createReel({
      autorId: userId,
      videoUrl,
      descripcion: this.reelDescripcion.trim() || undefined,
      etiquetas: this.reelEtiquetas.length > 0 ? this.reelEtiquetas : undefined,
    }).subscribe({
      next: (created: SocialReel) => {
        if (created) {
          this.reelStore.reelsCache.update(actual => [created, ...actual]);
          this.reels.update(list => [this.buildVm(created), ...list]);
          this.cargarAutores([created.autorId]);
          this.reelDescripcion = '';
          this.reelEtiquetas = [];
          this.selectedFile = null;
          this.uploading = false;
          this.uploadProgress = '';
          this.showComposer.set(false);
          this.currentIndex = 0;
          this.toast.success('Reel creado');
        }
        this.creating = false;
      },
      error: () => {
        this.creating = false;
        this.uploading = false;
        this.uploadProgress = '';
        this.toast.error('Error al crear reel');
      }
    });
  }

  // ─── Reproducción del video ───

  progressPercent(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
  }

  onTimeUpdate(video: HTMLVideoElement): void {
    this.currentTime = video.currentTime;
  }

  onLoadedMetadata(video: HTMLVideoElement): void {
    this.duration = video.duration || 0;
    // cada reel nuevo arranca en silencio por el autoplay
    this.muted = video.muted;
  }

  /** Tap sobre el video: pausa/reproduce como TikTok. */
  togglePlay(video: HTMLVideoElement): void {
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  /** Silenciar/activar sonido con el ícono del speaker. */
  toggleMute(video: HTMLVideoElement): void {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) {
      video.volume = 0.5;
      this.volume = 50;
    }
    this.muted = video.muted;
  }

  /** Barra de rango de volumen (0-100%) estilo TikTok. */
  setVolume(event: Event, video: HTMLVideoElement): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.volume = value;
    video.volume = value / 100;
    video.muted = value === 0;
    this.muted = video.muted;
  }

  volumeIcon(): string {
    return this.muted || this.volume === 0
      ? 'volume_off'
      : this.volume < 50
        ? 'volume_down'
        : 'volume_up';
  }

  startSeek(event: PointerEvent, bar: HTMLElement, video: HTMLVideoElement): void {
    this.draggingSeek = true;
    (event.currentTarget as HTMLElement)?.setPointerCapture?.(event.pointerId);
    this.seekTo(event, bar, video);
  }

  moveSeek(event: PointerEvent, bar: HTMLElement, video: HTMLVideoElement): void {
    if (!this.draggingSeek) return;
    this.seekTo(event, bar, video);
  }

  stopSeek(): void {
    this.draggingSeek = false;
  }

  private seekTo(event: PointerEvent, bar: HTMLElement, video: HTMLVideoElement): void {
    if (!this.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    video.currentTime = ratio * this.duration;
    this.currentTime = video.currentTime;
  }

  /** Total de comentarios + respuestas para el contador del panel. */
  commentCount(): number {
    const comments = this.reels()[this.currentIndex]?.comments ?? [];
    return comments.reduce((total, c) => total + 1 + (c.repliesCount ?? 0), 0);
  }

  // ─── Navegación ───

  /** Scroll del mouse/touchpad: baja o sube de reel como TikTok. */
  onWheel(event: WheelEvent): void {
    if (this.wheelLocked || Math.abs(event.deltaY) < 20) return;
    event.preventDefault();
    this.wheelLocked = true;
    if (event.deltaY > 0) {
      this.nextReel();
    } else {
      this.prevReel();
    }
    setTimeout(() => (this.wheelLocked = false), 650);
  }

  nextReel(): void {
    if (this.currentIndex < this.reels().length - 1) {
      this.currentIndex++;
      this.currentTime = 0;
      this.duration = 0;
      this.registrarVistaActual();
    }
    // a dos del final (o ya al final) se trae la siguiente pagina: el feed sigue solo
    if (this.currentIndex >= this.reels().length - 2 && this.hayMas) {
      this.cargarPagina(this.pagina + 1);
    }
  }

  prevReel(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentTime = 0;
      this.duration = 0;
      this.registrarVistaActual();
    }
  }

  /** Cuenta la vista del reel visible; una sola vez por reel y por sesión. */
  private registrarVistaActual(): void {
    const vm = this.reels()[this.currentIndex];
    if (!vm || vm.vistaContada || this.reelStore.vistasCache.has(vm.reel.id)) return;

    this.reelStore.vistasCache.add(vm.reel.id);
    this.reels.update(list => list.map(v =>
      v.reel.id === vm.reel.id ? { ...v, vistaContada: true } : v
    ));

    this.reelService.incrementReelView(vm.reel.id, this.getUserId() ?? undefined)
      .subscribe({ error: () => {} });
  }

  // ─── Reacciones ───

  toggleLike(vm: ReelVM): void {
    const userId = this.getUserId();
    if (!userId) return;

    if (vm.myReaction) {
      this.reactionService.unreact(userId, vm.reel.id, 'REEL').subscribe(() => {
        this.reelStore.myReactionsCache.delete(vm.reel.id);
        this.reels.update(list => list.map(v =>
          v.reel.id === vm.reel.id
            ? {
                ...v,
                myReaction: null,
                reel: this.withStats(v.reel, s => ({
                  ...s,
                  reaccionesCount: Math.max(0, (s.reaccionesCount ?? 0) - 1),
                })),
              }
            : v
        ));
      });
    } else {
      this.reactionService.react(userId, vm.reel.id, 'REEL', 'LIKE').subscribe(() => {
        this.reelStore.myReactionsCache.set(vm.reel.id, 'LIKE');
        this.reels.update(list => list.map(v =>
          v.reel.id === vm.reel.id
            ? {
                ...v,
                myReaction: 'LIKE' as TipoReaccion,
                reel: this.withStats(v.reel, s => ({
                  ...s,
                  reaccionesCount: (s.reaccionesCount ?? 0) + 1,
                })),
              }
            : v
        ));
      });
    }
  }

  toggleSave(vm: ReelVM): void {
    const userId = this.getUserId();
    if (!userId) return;

    const guardado = !vm.saved;

    // Optimista: se pinta al instante y si el backend falla se revierte.
    if (guardado) this.reelStore.guardadosCache.add(vm.reel.id);
    else this.reelStore.guardadosCache.delete(vm.reel.id);
    this.reels.update(list => list.map(v =>
      v.reel.id === vm.reel.id
        ? {
            ...v,
            saved: guardado,
            reel: this.withStats(v.reel, s => ({
              ...s,
              guardadosCount: Math.max(0, (s.guardadosCount ?? 0) + (guardado ? 1 : -1)),
            })),
          }
        : v
    ));

    const op = guardado
      ? this.reelService.saveReel(userId, vm.reel.id)
      : this.reelService.unsaveReel(userId, vm.reel.id);

    op.subscribe({
      next: () => {},
      error: () => {
        // Revierte el cambio optimista (tambien en la memoria de sesion).
        if (guardado) this.reelStore.guardadosCache.delete(vm.reel.id);
        else this.reelStore.guardadosCache.add(vm.reel.id);
        this.reels.update(list => list.map(v =>
          v.reel.id === vm.reel.id
            ? {
                ...v,
                saved: !guardado,
                reel: this.withStats(v.reel, s => ({
                  ...s,
                  guardadosCount: Math.max(0, (s.guardadosCount ?? 0) + (guardado ? -1 : 1)),
                })),
              }
            : v
        ));
        this.toast.error('No se pudo actualizar el guardado');
      }
    });
  }

  // ─── Comentarios ───

  toggleComments(vm: ReelVM): void {
    vm.showComments = !vm.showComments;
    if (vm.showComments && vm.comments.length === 0) {
      this.commentService.getComments(vm.reel.id, 'REEL').subscribe({
        next: (comments: SocialComment[]) => {
          this.reels.update(list => list.map(v =>
            v.reel.id === vm.reel.id
              ? { ...v, comments: comments.map(c => this.buildCommentVm(c)) }
              : v
          ));
          comments.forEach(c => {
            this.loadCommentAuthor(c.autorId, vm.reel.id);
            this.loadMyCommentReaction(c.id, vm.reel.id);
          });
        }
      });
    }
  }

  private loadCommentAuthor(autorId: string, reelId: string): void {
    this.userStore.getById(autorId).subscribe({
      next: (user: any) => {
        if (user) {
          const nombre = user.nombre ?? 'Usuario';
          const avatar = user.fotoPerfilUrl ?? '';
          this.reels.update(list => list.map(v =>
            v.reel.id === reelId
              ? {
                  ...v,
                  comments: v.comments.map(c => this.fillAuthor(c, autorId, nombre, avatar)),
                }
              : v
          ));
        }
      },
      error: () => {}
    });
  }

  /** Rellena nombre/foto en el comentario y sus respuestas (recursivo). */
  private fillAuthor(vm: ReelCommentVM, autorId: string, nombre: string, avatar: string): ReelCommentVM {
    const actualizado = vm.comment.autorId === autorId
      ? { ...vm, autorNombre: nombre, autorAvatar: avatar }
      : vm;
    return actualizado.replies.length > 0
      ? { ...actualizado, replies: actualizado.replies.map(r => this.fillAuthor(r, autorId, nombre, avatar)) }
      : actualizado;
  }

  private buildCommentVm(comment: SocialComment): ReelCommentVM {
    return {
      comment,
      autorNombre: '',
      autorAvatar: '',
      myReaction: null,
      likesCount: comment.reaccionesCount ?? 0,
      replies: [],
      repliesCount: comment.repliesCount ?? 0,
      repliesLoaded: false,
      showReplies: false,
      replyText: '',
      showReplyInput: false,
    };
  }

  /** Aplica fn al comentario commentId buscándolo también dentro de las respuestas. */
  private mapCommentDeep(list: ReelVM[], reelId: string, commentId: string, fn: (vm: ReelCommentVM) => ReelCommentVM): ReelVM[] {
    const mapList = (items: ReelCommentVM[]): ReelCommentVM[] =>
      items.map(c => {
        if (c.comment.id === commentId) return fn(c);
        return c.replies.length > 0 ? { ...c, replies: mapList(c.replies) } : c;
      });
    return list.map(v => (v.reel.id === reelId ? { ...v, comments: mapList(v.comments) } : v));
  }

  // ─── Comentarios: corazones, respuestas y reporte ───

  /** Corazón en un comentario (o en una respuesta). */
  toggleCommentLike(vm: ReelCommentVM, reelId: string): void {
    const userId = this.getUserId();
    if (!userId) return;

    if (vm.myReaction) {
      this.reactionService.unreact(userId, vm.comment.id, 'COMMENT').subscribe({
        next: () => {
          this.reels.update(list => this.mapCommentDeep(list, reelId, vm.comment.id, c => ({
            ...c, myReaction: null, likesCount: Math.max(0, c.likesCount - 1),
          })));
        }
      });
    } else {
      this.reactionService.react(userId, vm.comment.id, 'COMMENT', 'LIKE').subscribe({
        next: () => {
          this.reels.update(list => this.mapCommentDeep(list, reelId, vm.comment.id, c => ({
            ...c, myReaction: 'LIKE', likesCount: c.likesCount + 1,
          })));
        }
      });
    }
  }

  toggleReplyInput(vm: ReelCommentVM, reelId: string): void {
    this.reels.update(list => this.mapCommentDeep(list, reelId, vm.comment.id, c => ({
      ...c, showReplyInput: !c.showReplyInput,
    })));
  }

  /** Muestra/oculta las respuestas de un comentario (las carga la primera vez). */
  toggleReplies(vm: ReelCommentVM, reelId: string): void {
    const show = !vm.showReplies;
    this.reels.update(list => this.mapCommentDeep(list, reelId, vm.comment.id, c => ({
      ...c, showReplies: show,
    })));
    if (show && !vm.repliesLoaded) {
      this.commentService.getReplies(vm.comment.id).subscribe({
        next: (replies: SocialComment[]) => {
          const vms = replies.map(r => this.buildCommentVm(r));
          this.reels.update(list => this.mapCommentDeep(list, reelId, vm.comment.id, c => ({
            ...c,
            replies: vms,
            repliesLoaded: true,
            repliesCount: Math.max(c.repliesCount, vms.length),
          })));
          replies.forEach(r => {
            this.loadCommentAuthor(r.autorId, reelId);
            this.loadMyCommentReaction(r.id, reelId);
          });
        }
      });
    }
  }

  /** Responde un comentario (subcomentario, como en inicio). */
  addReply(vm: ReelCommentVM, reelId: string): void {
    const userId = this.getUserId();
    const text = vm.replyText.trim();
    if (!userId || !text) return;

    this.commentService.createComment(userId, reelId, text, 'REEL', vm.comment.id).subscribe({
      next: (created: SocialComment) => {
        if (!created) return;
        const nuevo = this.buildCommentVm(created);
        nuevo.autorNombre = this.myName;
        nuevo.autorAvatar = this.myAvatar;
        this.reels.update(list => this.mapCommentDeep(list, reelId, vm.comment.id, c => ({
          ...c,
          replies: [...c.replies, nuevo],
          repliesCount: c.repliesCount + 1,
          showReplies: true,
          repliesLoaded: true,
          showReplyInput: false,
          replyText: '',
        })));
      }
    });
  }

  /** Abre el modal de reporte con el comentario elegido (o su respuesta). */
  openReport(vm: ReelCommentVM): void {
    this.reportTarget = vm;
  }

  /** Envía el reporte elegido en el modal (motivo + descripción) al backend. */
  onReportConfirm(payload: ReportPayload): void {
    const userId = this.getUserId();
    const vm = this.reportTarget;
    this.reportTarget = null;
    if (!userId || !vm) return;

    const motivo = payload.descripcion ? `${payload.motivo} — ${payload.descripcion}` : payload.motivo;
    this.reportService.report(userId, 'COMMENT', vm.comment.id, motivo).subscribe({
      next: () => this.toast.success('Reporte enviado. Gracias por ayudar a la comunidad.'),
      error: (err: any) => {
        const msg = err?.error?.message ?? 'No se pudo enviar el reporte';
        this.toast.error(msg);
      },
    });
  }

  onReportCancel(): void {
    this.reportTarget = null;
  }

  private loadMyCommentReaction(commentId: string, reelId: string): void {
    const userId = this.getUserId();
    if (!userId) return;
    this.reactionService.getMyReaction(userId, commentId, 'COMMENT').subscribe({
      next: (r: any) => {
        if (!r) return;
        this.reels.update(list => this.mapCommentDeep(list, reelId, commentId, c => ({
          ...c, myReaction: r.tipoReaccion ?? null,
        })));
      },
      error: () => {}
    });
  }

  addComment(vm: ReelVM): void {
    const userId = this.getUserId();
    const text = vm.newComment.trim();
    if (!userId || !text) return;

    this.commentService.createComment(userId, vm.reel.id, text, 'REEL').subscribe({
      next: (created: SocialComment) => {
        if (created) {
          this.reels.update(list => list.map(v =>
            v.reel.id === vm.reel.id
              ? {
                  ...v,
                  comments: [...v.comments, { ...this.buildCommentVm(created), autorNombre: this.myName, autorAvatar: this.myAvatar }],
                  newComment: '',
                  reel: this.withStats(v.reel, s => ({
                    ...s,
                    comentariosCount: (s.comentariosCount ?? 0) + 1,
                  })),
                }
              : v
          ));
        }
      }
    });
  }

  askDeleteReel(vm: ReelVM): void {
    this.pendingDeleteId.set(vm.reel.id);
    this.deleteConfirmOpen.set(true);
  }

  onCancelDelete(): void {
    this.deleteConfirmOpen.set(false);
    this.pendingDeleteId.set(null);
  }

  onConfirmDelete(): void {
    const reelId = this.pendingDeleteId();
    const userId = this.getUserId();
    this.deleteConfirmOpen.set(false);
    this.pendingDeleteId.set(null);
    if (!reelId || !userId) return;

    this.reelService.deleteReel(reelId, userId).subscribe({
      next: (ok: boolean) => {
        if (ok) {
          this.reelStore.reelsCache.update(actual => actual.filter(r => r.id !== reelId));
          this.reels.update(list => list.filter(r => r.reel.id !== reelId));
          if (this.currentIndex >= this.reels().length) {
            this.currentIndex = Math.max(0, this.reels().length - 1);
          }
          this.toast.success('Reel eliminado');
        } else {
          this.toast.error('No se pudo eliminar el reel');
        }
      },
      error: () => this.toast.error('Error al eliminar reel')
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  goToProfile(autorId: string): void {
    this.router.navigate(['/profile', autorId]);
  }

  /** Devuelve el reel con las estadísticas pasadas por `fn`, sin mutar el original. */
  private withStats(
    reel: SocialReel,
    fn: (stats: NonNullable<SocialReel['estadisticas']>) => NonNullable<SocialReel['estadisticas']>
  ): SocialReel {
    return { ...reel, estadisticas: fn(reel.estadisticas ?? {}) };
  }
}
