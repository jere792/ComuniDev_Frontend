import { Component, OnInit, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { PostStore } from '@features/recruiter/pages/inicio/data-access/state/post.store';
import { CommentStore } from '@features/shared/data-access/state/comment.store';
import { ReactionStore } from '@features/shared/data-access/state/reaction.store';
import { SocialPost } from '@features/recruiter/pages/inicio/domain/models/social-post.model';
import { SocialComment } from '@features/shared/domain/models/social-comment.model';
import { TipoReaccion } from '@features/shared/domain/models/social-reaction.model';
import { UserStore } from '@features/users/data-access/state/user.store';
import { FeedSkeletonComponent } from '@shared/ui/feed-skeleton/feed-skeleton';
import { ToastService } from '@core/services/toast.service';
import { ImageEditorService } from '@core/services/image-editor.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';

interface CommentVM {
  comment: SocialComment;
  autorNombre: string;
  autorAvatar: string;
  myReaction: TipoReaccion | null;
  replies: CommentVM[];
  repliesCount: number;
  repliesLoaded: boolean;
  showReplies: boolean;
  showReplyInput: boolean;
  replyText: string;
  showReactionDropdown: boolean;
}

interface PostVM {
  post: SocialPost;
  autorNombre: string;
  autorAvatar: string;
  myReaction: TipoReaccion | null;
  showComments: boolean;
  comments: CommentVM[];
  visibleComments: number;
  newComment: string;
  isEditing: boolean;
  editText: string;
  showReactionsDropdown: boolean;
}

const REACTION_CONFIG: Record<TipoReaccion, { icon: string; label: string; color: string; emoji: string }> = {
  LIKE: { icon: 'thumb_up', label: 'Me gusta', color: '#1877F2', emoji: '👍' },
  LOVE: { icon: 'favorite', label: 'Me encanta', color: '#F33E58', emoji: '❤️' },
  CELEBRATE: { icon: 'celebration', label: 'Celebrar', color: '#F7B928', emoji: '🎉' },
  SUPPORT: { icon: 'volunteer_activism', label: 'Apoyar', color: '#44B37D', emoji: '💪' },
};

@Component({
  selector: 'app-reports',
  imports: [FormsModule, DatePipe, NgTemplateOutlet, FeedSkeletonComponent, ConfirmModal],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsComponent implements OnInit {
  private postService = inject(PostStore);
  private commentService = inject(CommentStore);
  private reactionService = inject(ReactionStore);
  private userStore = inject(UserStore);
  private router = inject(Router);
  private toast = inject(ToastService);
  private imageEditor = inject(ImageEditorService);

  posts = signal<PostVM[]>([]);
  composerText = '';
  composerImage: string | null = null;
  uploadingImage = false;
  loading = signal(true);
  showComposerModal = signal(false);
  showCommentsModal = signal(false);
  modalPostId = signal<string>('');
  modalNewComment = '';
  modalComments = computed<CommentVM[]>(() => {
    const id = this.modalPostId();
    if (!id) return [];
    return this.posts().find(v => v.post.id === id)?.comments ?? [];
  });
  modalCommentCount = computed<number>(() => {
    const id = this.modalPostId();
    if (!id) return 0;
    return this.posts().find(v => v.post.id === id)?.post.estadisticas?.comentariosCount ?? 0;
  });
  deleteConfirmOpen = signal(false);
  pendingDeleteId = signal<string | null>(null);

  reactionTypes: TipoReaccion[] = ['LIKE', 'LOVE', 'CELEBRATE', 'SUPPORT'];
  reactionConfig = REACTION_CONFIG;

  private userCache = new Map<string, { nombre: string; avatar: string }>();

  private getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getUserIdPublic(): string | null {
    return this.getUserId();
  }

  ngOnInit(): void {
    const userId = this.getUserId();
    if (!userId) {
      this.loading.set(false);
      return;
    }

    this.postService.getFeed(userId, 0, 20).subscribe({
      next: (data: SocialPost[]) => {
        this.posts.set(data.map(p => this.buildVm(p)));
        this.loading.set(false);
        data.forEach(p => this.loadAuthor(p.autorId));
        this.loadMyReactions(data);
        data.forEach(p => this.loadCommentCountSilently(p));
        this.posts().forEach(vm => this.loadComments(vm));
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private buildVm(post: SocialPost): PostVM {
    return {
      post,
      autorNombre: '',
      autorAvatar: '',
      myReaction: null,
      showComments: true,
      comments: [],
      visibleComments: 3,
      newComment: '',
      isEditing: false,
      editText: '',
      showReactionsDropdown: false,
    };
  }

  private buildCommentVm(comment: SocialComment): CommentVM {
    return {
      comment,
      autorNombre: '',
      autorAvatar: '',
      myReaction: null,
      replies: [],
      repliesCount: comment.repliesCount ?? 0,
      repliesLoaded: false,
      showReplies: false,
      showReplyInput: false,
      replyText: '',
      showReactionDropdown: false,
    };
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
    this.posts.update(list => list.map(vm => {
      if (vm.post.autorId === autorId) {
        return { ...vm, autorNombre: info.nombre, autorAvatar: info.avatar };
      }
      return vm;
    }));
  }

  private loadMyReactions(feed: SocialPost[]): void {
    const userId = this.getUserId();
    if (!userId) return;

    feed.forEach(post => {
      this.reactionService.getMyReaction(userId, post.id, 'POST').subscribe({
        next: (r: any) => {
          if (r) {
            this.posts.update(list => list.map(vm =>
              vm.post.id === post.id ? { ...vm, myReaction: r.tipoReaccion } : vm
            ));
          }
        }
      });
    });
  }

  // ─── Composer ───

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const edited = await this.imageEditor.open(file, {
      aspect: null,
      aspectOptions: [
        { label: 'Libre', value: null },
        { label: '1:1', value: 1 },
        { label: '4:5', value: 4 / 5 },
        { label: '16:9', value: 16 / 9 },
      ],
      maxSide: 1600,
      title: 'Editar imagen del post',
      quality: 0.85,
    });
    if (!edited) return;

    this.uploadingImage = true;
    this.userStore.uploadFile(edited).subscribe({
      next: (res: any) => {
        this.composerImage = res?.secure_url ?? res?.url ?? null;
        this.uploadingImage = false;
        this.toast.success('Imagen lista para publicar');
      },
      error: () => {
        this.uploadingImage = false;
        this.toast.error('Error al subir imagen');
      }
    });
  }

  removeImage(): void {
    this.composerImage = null;
  }

  publish(): void {
    const userId = this.getUserId();
    const text = this.composerText.trim();
    if (!userId || (!text && !this.composerImage)) return;

    const contenido: any = { texto: text || undefined };
    if (this.composerImage) contenido.imagenes = [this.composerImage];

    this.postService.createPost(userId, contenido).subscribe({
      next: (created: SocialPost) => {
        if (created) {
          this.posts.update(list => [this.buildVm(created), ...list]);
          this.loadAuthor(created.autorId);
          this.composerText = '';
          this.composerImage = null;
          this.showComposerModal.set(false);
          this.toast.success('Publicación creada');
        }
      },
      error: () => this.toast.error('Error al crear publicación')
    });
  }

  closeComposerModal(): void {
    this.showComposerModal.set(false);
    this.composerText = '';
    this.composerImage = null;
  }

  // ─── Post Reacciones ───

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAllDropdowns();
  }

  private closeAllDropdowns(): void {
    const anyOpen = this.posts().some(v => v.showReactionsDropdown || this.hasOpenCommentDropdown(v.comments));
    if (!anyOpen) return;
    this.posts.update(list => list.map(v => ({
      ...v,
      showReactionsDropdown: false,
      comments: this.closeCommentDropdowns(v.comments),
    })));
  }

  private hasOpenCommentDropdown(comments: CommentVM[]): boolean {
    return comments.some(c => c.showReactionDropdown || this.hasOpenCommentDropdown(c.replies));
  }

  private closeCommentDropdowns(comments: CommentVM[]): CommentVM[] {
    return comments.map(c => ({
      ...c,
      showReactionDropdown: false,
      replies: this.closeCommentDropdowns(c.replies),
    }));
  }

  private setCommentDropdown(comments: CommentVM[], targetId: string, willOpen: boolean): CommentVM[] {
    return comments.map(c => ({
      ...c,
      showReactionDropdown: c.comment.id === targetId ? willOpen : false,
      replies: this.setCommentDropdown(c.replies, targetId, willOpen),
    }));
  }

  toggleReactionsDropdown(vm: PostVM): void {
    const willOpen = !vm.showReactionsDropdown;
    this.posts.update(list => list.map(v => ({
      ...v,
      showReactionsDropdown: v.post.id === vm.post.id ? willOpen : false,
      comments: this.closeCommentDropdowns(v.comments),
    })));
  }

  selectReaction(vm: PostVM, type: TipoReaccion): void {
    this.toggleReaction(vm, type);
    this.closeAllDropdowns();
  }

  toggleReaction(vm: PostVM, type: TipoReaccion): void {
    const userId = this.getUserId();
    if (!userId) return;

    const currentCount = vm.post.estadisticas?.reaccionesCount ?? 0;

    if (vm.myReaction === type) {
      this.reactionService.unreact(userId, vm.post.id, 'POST').subscribe({
        next: () => {
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? {
            ...v,
            myReaction: null,
            post: { ...v.post, estadisticas: { ...v.post.estadisticas, reaccionesCount: Math.max(0, currentCount - 1) } }
          } : v));
        },
        error: (err) => console.error('Failed to unreact:', err)
      });
    } else if (vm.myReaction) {
      this.reactionService.react(userId, vm.post.id, 'POST', type).subscribe({
        next: () => {
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? { ...v, myReaction: type } : v));
        },
        error: (err) => console.error('Failed to react:', err)
      });
    } else {
      this.reactionService.react(userId, vm.post.id, 'POST', type).subscribe({
        next: () => {
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? {
            ...v,
            myReaction: type,
            post: { ...v.post, estadisticas: { ...v.post.estadisticas, reaccionesCount: currentCount + 1 } }
          } : v));
        },
        error: (err) => console.error('Failed to react:', err)
      });
    }
  }

  getReactionEmoji(vm: PostVM): string {
    return vm.myReaction ? this.reactionConfig[vm.myReaction].emoji : '😊';
  }

  getReactionLabel(vm: PostVM): string {
    return vm.myReaction ? this.reactionConfig[vm.myReaction].label : 'Reacciones';
  }

  // ─── Comentarios ───

  toggleComments(vm: PostVM): void {
    const newShow = !vm.showComments;
    this.posts.update(list => list.map(v => v.post.id === vm.post.id ? { ...v, showComments: newShow } : v));
    if (newShow && vm.comments.length === 0) {
      this.loadComments(vm);
    }
  }

  private loadComments(vm: PostVM): void {
    this.commentService.getComments(vm.post.id, 'POST').subscribe({
      next: (comments: SocialComment[]) => {
        const vms = comments.map(c => this.buildCommentVm(c));
        this.posts.update(list => list.map(v => {
          if (v.post.id === vm.post.id) {
            return { ...v, comments: vms };
          }
          return v;
        }));
        comments.forEach(c => {
          this.loadCommentAuthor(c.autorId, vm.post.id);
          this.loadMyReactionForVm(vm.post.id, c.id);
        });
      },
      error: (err) => console.error('Failed to load comments:', err)
    });
  }

  private bumpCommentCount(postId: string, delta: number): void {
    this.posts.update(list => list.map(v => v.post.id === postId ? {
      ...v,
      post: {
        ...v.post,
        estadisticas: {
          ...v.post.estadisticas,
          comentariosCount: Math.max(0, (v.post.estadisticas?.comentariosCount ?? 0) + delta),
        },
      },
    } : v));
  }

  private setCommentCount(postId: string, count: number): void {
    this.posts.update(list => list.map(v => v.post.id === postId ? {
      ...v,
      post: { ...v.post, estadisticas: { ...v.post.estadisticas, comentariosCount: count } },
    } : v));
  }

  private loadCommentCountSilently(post: SocialPost): void {
    this.commentService.countComments(post.id, 'POST').subscribe({
      next: (count: number) => this.setCommentCount(post.id, count),
      error: () => {}
    });
  }

  private mapComments(comments: CommentVM[], fn: (cvm: CommentVM) => CommentVM): CommentVM[] {
    return comments.map(cvm => {
      const mapped = fn(cvm);
      if (mapped.replies.length > 0) {
        return { ...mapped, replies: this.mapComments(mapped.replies, fn) };
      }
      return mapped;
    });
  }

  private updatePostComments(postId: string, fn: (cvm: CommentVM) => CommentVM): void {
    this.posts.update(list => list.map(v =>
      v.post.id === postId ? { ...v, comments: this.mapComments(v.comments, fn) } : v
    ));
  }

  private loadCommentAuthor(autorId: string, postId: string): void {
    const apply = (info: { nombre: string; avatar: string }) => {
      this.updatePostComments(postId, c =>
        c.comment.autorId === autorId ? { ...c, autorNombre: info.nombre, autorAvatar: info.avatar } : c
      );
    };

    if (this.userCache.has(autorId)) {
      apply(this.userCache.get(autorId)!);
      return;
    }

    this.userStore.getById(autorId).subscribe({
      next: (user: any) => {
        if (user) {
          const info = { nombre: user.nombre ?? 'Usuario', avatar: user.fotoPerfilUrl ?? '' };
          this.userCache.set(autorId, info);
          apply(info);
        }
      },
      error: () => {}
    });
  }

  private loadMyReactionForVm(postId: string, commentId: string): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.reactionService.getMyReaction(userId, commentId, 'COMMENT').subscribe({
      next: (r: any) => {
        if (r) {
          this.updatePostComments(postId, c =>
            c.comment.id === commentId ? { ...c, myReaction: r.tipoReaccion } : c
          );
        }
      }
    });
  }

  openCommentsModal(vm: PostVM): void {
    this.modalPostId.set(vm.post.id);
    if (vm.comments.length === 0) {
      this.loadComments(vm);
    }
    this.showCommentsModal.set(true);
  }

  closeCommentsModal(): void {
    this.showCommentsModal.set(false);
    this.modalNewComment = '';
  }

  addComment(vm: PostVM): void {
    this.addCommentToPost(vm.post.id, vm.newComment);
  }

  addCommentToPost(postId: string, text: string): void {
    const userId = this.getUserId();
    const value = text.trim();
    if (!userId || !value) return;

    this.commentService.createComment(userId, postId, value, 'POST').subscribe({
      next: (created: SocialComment) => {
        if (!created) return;

        const newVm = this.buildCommentVm(created);
        const cached = this.userCache.get(userId);
        newVm.autorNombre = cached?.nombre ?? '';
        newVm.autorAvatar = cached?.avatar ?? '';

        this.posts.update(list => list.map(v =>
          v.post.id === postId ? { ...v, comments: [...v.comments, newVm], newComment: '' } : v
        ));
        this.bumpCommentCount(postId, 1);
        this.loadCommentAuthor(created.autorId, postId);
        this.modalNewComment = '';
      },
      error: (err) => console.error('Failed to create comment:', err)
    });
  }

  // ─── Comment Reacciones ───

  toggleCommentReactionsDropdown(commentVm: CommentVM): void {
    const targetId = commentVm.comment.id;
    const willOpen = !commentVm.showReactionDropdown;
    this.posts.update(list => list.map(v => ({
      ...v,
      showReactionsDropdown: false,
      comments: this.setCommentDropdown(v.comments, targetId, willOpen),
    })));
  }

  getCommentReactionText(commentVm: CommentVM): string {
    if (!commentVm.myReaction) return 'Like';
    const config = this.reactionConfig[commentVm.myReaction];
    return `${config.emoji} ${config.label}`;
  }

  selectCommentReaction(commentVm: CommentVM, type: TipoReaccion, postId: string): void {
    const commentId = commentVm.comment.id;
    const currentCount = commentVm.comment.reaccionesCount ?? 0;
    const myReaction = commentVm.myReaction;
    this.closeAllDropdowns();

    const userId = this.getUserId();
    if (!userId) return;

    if (myReaction === type) {
      this.reactionService.unreact(userId, commentId, 'COMMENT').subscribe({
        next: () => this.updatePostComments(postId, c =>
          c.comment.id === commentId ? {
            ...c,
            myReaction: null,
            comment: { ...c.comment, reaccionesCount: Math.max(0, currentCount - 1) }
          } : c
        ),
        error: (err) => console.error('Failed to unreact comment:', err)
      });
    } else if (myReaction) {
      this.reactionService.react(userId, commentId, 'COMMENT', type).subscribe({
        next: () => this.updatePostComments(postId, c =>
          c.comment.id === commentId ? { ...c, myReaction: type } : c
        ),
        error: (err) => console.error('Failed to change comment reaction:', err)
      });
    } else {
      this.reactionService.react(userId, commentId, 'COMMENT', type).subscribe({
        next: () => this.updatePostComments(postId, c =>
          c.comment.id === commentId ? {
            ...c,
            myReaction: type,
            comment: { ...c.comment, reaccionesCount: currentCount + 1 }
          } : c
        ),
        error: (err) => console.error('Failed to react comment:', err)
      });
    }
  }

  // ─── Replies ───

  toggleReplyInput(commentVm: CommentVM): void {
    commentVm.showReplyInput = !commentVm.showReplyInput;
  }

  toggleReplies(commentVm: CommentVM, postId: string): void {
    const show = !commentVm.showReplies;
    this.updatePostComments(postId, c =>
      c.comment.id === commentVm.comment.id ? { ...c, showReplies: show } : c
    );
    if (show && !commentVm.repliesLoaded) {
      this.loadReplies(commentVm, postId);
    }
  }

  private loadReplies(commentVm: CommentVM, postId: string): void {
    this.commentService.getReplies(commentVm.comment.id).subscribe({
      next: (replies: SocialComment[]) => {
        const vms = replies.map(r => this.buildCommentVm(r));
        this.updatePostComments(postId, c =>
          c.comment.id === commentVm.comment.id
            ? { ...c, replies: vms, repliesLoaded: true, repliesCount: Math.max(c.repliesCount, vms.length) }
            : c
        );
        replies.forEach(r => {
          this.loadCommentAuthor(r.autorId, postId);
          this.loadMyReactionForVm(postId, r.id);
        });
      },
      error: (err) => console.error('Failed to load replies:', err)
    });
  }

  addReply(commentVm: CommentVM, postId: string): void {
    const userId = this.getUserId();
    const text = commentVm.replyText.trim();
    if (!userId || !text) return;

    const wasLoaded = commentVm.repliesLoaded;

    this.commentService.createComment(userId, postId, text, 'POST', commentVm.comment.id).subscribe({
      next: (created: SocialComment) => {
        if (!created) return;

        const newReply = this.buildCommentVm(created);
        const cached = this.userCache.get(userId);
        newReply.autorNombre = cached?.nombre ?? '';
        newReply.autorAvatar = cached?.avatar ?? '';

        this.updatePostComments(postId, c => {
          if (c.comment.id !== commentVm.comment.id) return c;
          return {
            ...c,
            replies: wasLoaded ? [...c.replies, newReply] : c.replies,
            repliesCount: c.repliesCount + 1,
            showReplies: true,
            replyText: '',
            showReplyInput: false,
          };
        });

        if (!wasLoaded) {
          this.loadReplies(commentVm, postId);
        }
        this.bumpCommentCount(postId, 1);
      },
      error: (err) => console.error('Failed to create reply:', err)
    });
  }

  // ─── Editar / eliminar ───

  startEdit(vm: PostVM): void {
    vm.isEditing = true;
    vm.editText = vm.post.contenido?.texto ?? '';
  }

  saveEdit(vm: PostVM): void {
    this.postService.updatePost(vm.post.id, { contenido: { texto: vm.editText.trim() } }).subscribe({
      next: (updated: any) => {
        if (updated) {
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? {
            ...v,
            isEditing: false,
            post: { ...v.post, contenido: { ...v.post.contenido, texto: vm.editText.trim() } }
          } : v));
          this.toast.success('Publicación actualizada');
        }
      },
      error: () => this.toast.error('Error al actualizar publicación')
    });
  }

  cancelEdit(vm: PostVM): void {
    this.posts.update(list => list.map(v => v.post.id === vm.post.id ? { ...v, isEditing: false, editText: '' } : v));
  }

  askDeletePost(vm: PostVM): void {
    this.pendingDeleteId.set(vm.post.id);
    this.deleteConfirmOpen.set(true);
  }

  onCancelDelete(): void {
    this.deleteConfirmOpen.set(false);
    this.pendingDeleteId.set(null);
  }

  onConfirmDelete(): void {
    const postId = this.pendingDeleteId();
    this.deleteConfirmOpen.set(false);
    this.pendingDeleteId.set(null);
    if (!postId) return;

    this.postService.deletePost(postId).subscribe({
      next: (ok: boolean) => {
        if (ok) {
          this.posts.update(list => list.filter(p => p.post.id !== postId));
          this.toast.success('Publicación eliminada');
        } else {
          this.toast.error('No se pudo eliminar la publicación');
        }
      },
      error: () => this.toast.error('Error al eliminar publicación')
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  goToProfile(autorId: string): void {
    this.router.navigate(['/profile', autorId]);
  }
}
