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
  comments: { comment: SocialComment; autorNombre: string }[];
  newComment: string;
  /** Para no contar la vista dos veces si vuelve a entrar al mismo reel. */
  vistaContada: boolean;
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

  reels = signal<ReelVM[]>([]);
  currentIndex = 0;
  loading = signal(true);
  deleteConfirmOpen = signal(false);
  pendingDeleteId = signal<string | null>(null);

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
  /** Nombre del usuario logueado, para firmar sus comentarios sin inventarlo. */
  private myName = 'Tú';

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

  // ─── Navegación ───

  nextReel(): void {
    if (this.currentIndex < this.reels().length - 1) {
      this.currentIndex++;
      this.registrarVistaActual();
    }
  }

  prevReel(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
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
              ? { ...v, comments: comments.map(c => ({ comment: c, autorNombre: '' })) }
              : v
          ));
          comments.forEach(c => this.loadCommentAuthor(c.autorId, vm.reel.id));
        }
      });
    }
  }

  private loadCommentAuthor(autorId: string, reelId: string): void {
    this.userStore.getById(autorId).subscribe({
      next: (user: any) => {
        if (user) {
          this.reels.update(list => list.map(v =>
            v.reel.id === reelId
              ? {
                  ...v,
                  comments: v.comments.map(c =>
                    c.comment.autorId === autorId
                      ? { ...c, autorNombre: user.nombre ?? 'Usuario' }
                      : c
                  ),
                }
              : v
          ));
        }
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
                  comments: [...v.comments, { comment: created, autorNombre: this.myName }],
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
