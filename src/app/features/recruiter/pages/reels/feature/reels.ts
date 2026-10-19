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
  imports: [FormsModule, DatePipe, ConfirmModal, TagInputComponent],
  templateUrl: './reels.html',
  styleUrl: './reels.scss',
})
export class RecruiterReels implements OnInit {
  private reelService = inject(ReelStore);
  private reactionService = inject(ReactionStore);
  private commentService = inject(CommentStore);
  private userStore = inject(UserStore);
  private uploadService = inject(UploadService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private reportService = inject(ReportService);

  reels = signal<ReelVM[]>([]);
  currentIndex = 0;
  loading = signal(true);
  deleteConfirmOpen = signal(false);
  pendingDeleteId = signal<string | null>(null);

  // Reproducción del video (barra de progreso estilo TikTok)
  currentTime = 0;
  duration = 0;
  /** Volumen en porcentaje (0-100) para la barra de rango. */
  volume = 100;
  /** Autoplay arranca cada video en silencio. */
  muted = true;
  private draggingSeek = false;

  // Composer
  showComposer = signal(false);
  reelVideoUrl = '';
  reelDescripcion = '';
  reelEtiquetas: string[] = [];
  creating = false;
  /** Archivo elegido para subir; se sube al backend al publicar. */
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = '';

  private userCache = new Map<string, { nombre: string; avatar: string }>();
  /** Nombre y foto del usuario logueado, para firmar sus comentarios sin inventarlos. */
  private myName = 'Tú';
  private myAvatar = '';

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  ngOnInit(): void {
    const me = this.getUserId();
    if (me) this.loadMyName(me);

    this.reelService.getReels().subscribe({
      next: (data: SocialReel[]) => {
        this.reels.set(data.map(r => this.buildVm(r)));
        this.loading.set(false);
        data.forEach(r => this.loadAuthor(r.autorId));
        this.loadMyReactions(data);
        this.loadSavedState(data);
        // El reel que queda a la vista al entrar tambien cuenta como vista.
        this.registrarVistaActual();
      },
      error: () => {
        this.loading.set(false);
      }
    });
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

  private loadAuthor(autorId: string): void {
    if (this.userCache.has(autorId)) {
      this.applyAuthor(autorId, this.userCache.get(autorId)!);
      return;
    }

    this.userStore.getById(autorId).subscribe({
      next: (user: any) => {
        if (user) {
          const info = { nombre: user.nombre ?? 'Usuario', avatar: user.fotoPerfilUrl ?? '' };
          this.userCache.set(autorId, info);
          this.applyAuthor(autorId, info);
        }
      },
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
    if (!userId) return;

    reels.forEach(reel => {
      this.reactionService.getMyReaction(userId, reel.id, 'REEL').subscribe({
        next: (r: any) => {
          if (r) {
            this.reels.update(list => list.map(vm =>
              vm.reel.id === reel.id ? { ...vm, myReaction: r.tipoReaccion } : vm
            ));
          }
        }
      });
    });
  }

  /** Consulta al backend cuales de estos reels ya tiene guardados el usuario. */
  private loadSavedState(reels: SocialReel[]): void {
    const userId = this.getUserId();
    if (!userId || reels.length === 0) return;

    forkJoin(reels.map(reel =>
      this.reelService.isReelSaved(userId, reel.id)
    )).subscribe({
      next: (flags) => {
        this.reels.update(list => list.map(vm => {
          const index = reels.findIndex(r => r.id === vm.reel.id);
          return index >= 0 ? { ...vm, saved: flags[index] } : vm;
        }));
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
    // Si elige un archivo, la URL escrita a mano deja de mandar.
    if (file) this.reelVideoUrl = '';
  }

  createReel(): void {
    const userId = this.getUserId();
    if (!userId || (!this.reelVideoUrl.trim() && !this.selectedFile)) return;

    this.creating = true;

    // Con archivo, primero se sube al backend y con la URL resultante se crea
    // el reel. Sin archivo se usa la URL escrita a mano.
    if (this.selectedFile) {
      this.uploading = true;
      this.uploadProgress = 'Subiendo video...';

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
      return;
    }

    this.publishReel(userId, this.reelVideoUrl.trim());
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
          this.reels.update(list => [this.buildVm(created), ...list]);
          this.loadAuthor(created.autorId);
          this.reelVideoUrl = '';
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

  // ─── Navegación ───

  nextReel(): void {
    if (this.currentIndex < this.reels().length - 1) {
      this.currentIndex++;
      this.currentTime = 0;
      this.duration = 0;
      this.registrarVistaActual();
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
    if (!vm || vm.vistaContada) return;

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
        // Revierte el cambio optimista.
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

  /** Reporta un comentario (o respuesta) al backend para moderación. */
  reportComment(vm: ReelCommentVM): void {
    const userId = this.getUserId();
    if (!userId) return;
    this.reportService.report(userId, 'COMMENT', vm.comment.id, 'Comentario reportado desde la app').subscribe({
      next: () => this.toast.success('Comentario reportado. Gracias por ayudar a la comunidad.'),
      error: (err: any) => {
        const msg = err?.error?.message ?? 'No se pudo reportar el comentario';
        this.toast.error(msg);
      },
    });
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
