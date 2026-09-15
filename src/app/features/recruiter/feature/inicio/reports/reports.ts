import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PostGraphqlService, SocialPost } from '../../../../../core/services/social/post-graphql.service';
import { CommentGraphqlService, SocialComment } from '../../../../../core/services/social/comment-graphql.service';
import { ReactionGraphqlService, TipoReaccion } from '../../../../../core/services/social/reaction-graphql.service';
import { GraphQLService } from '../../../../../core/services/graphql.service';
import { FeedSkeletonComponent } from '../../../../../shared/ui/feed-skeleton/feed-skeleton';

interface CommentVM {
  comment: SocialComment;
  autorNombre: string;
  autorAvatar: string;
  myReaction: TipoReaccion | null;
  replies: CommentVM[];
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
  imports: [FormsModule, DatePipe, FeedSkeletonComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsComponent implements OnInit {
  private postService = inject(PostGraphqlService);
  private commentService = inject(CommentGraphqlService);
  private reactionService = inject(ReactionGraphqlService);
  private graphql = inject(GraphQLService);
  private router = inject(Router);

  posts = signal<PostVM[]>([]);
  composerText = '';
  composerImage: string | null = null;
  uploadingImage = false;
  loading = signal(true);
  showComposerModal = signal(false);
  showCommentsModal = signal(false);
  modalComments = signal<CommentVM[]>([]);

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
      showComments: false,
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

    this.graphql.getUser(autorId).subscribe({
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingImage = true;
    this.graphql.uploadFile(file).subscribe({
      next: (res: any) => {
        this.composerImage = res?.secure_url ?? res?.url ?? null;
        this.uploadingImage = false;
      },
      error: () => {
        this.uploadingImage = false;
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
        }
      },
      error: () => {}
    });
  }

  closeComposerModal(): void {
    this.showComposerModal.set(false);
    this.composerText = '';
    this.composerImage = null;
  }

  // ─── Post Reacciones ───

  toggleReactionsDropdown(vm: PostVM): void {
    this.posts.update(list => list.map(v => ({
      ...v,
      showReactionsDropdown: v.post.id === vm.post.id ? !v.showReactionsDropdown : false,
    })));
  }

  selectReaction(vm: PostVM, type: TipoReaccion): void {
    this.toggleReaction(vm, type);
    this.posts.update(list => list.map(v => ({ ...v, showReactionsDropdown: false })));
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
          this.loadCommentReaction(c, vm.post.id);
        });
        this.updateCount(vm.post.id, vms.length);
      },
      error: (err) => console.error('Failed to load comments:', err)
    });
  }

  private updateCount(postId: string, count: number): void {
    this.posts.update(list => list.map(v => v.post.id === postId ? {
      ...v,
      post: { ...v.post, estadisticas: { ...v.post.estadisticas, comentariosCount: count } }
    } : v));
  }

  private loadCommentAuthor(autorId: string, postId: string): void {
    const apply = (info: { nombre: string; avatar: string }) => {
      this.posts.update(list => list.map(v => {
        if (v.post.id !== postId) return v;
        return { ...v, comments: v.comments.map(c =>
          c.comment.autorId === autorId ? { ...c, autorNombre: info.nombre, autorAvatar: info.avatar } : c
        )};
      }));
    };

    if (this.userCache.has(autorId)) {
      apply(this.userCache.get(autorId)!);
      return;
    }

    this.graphql.getUser(autorId).subscribe({
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

  private loadCommentReaction(comment: SocialComment, postId: string): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.reactionService.getMyReaction(userId, comment.id, 'COMMENT').subscribe({
      next: (r: any) => {
        if (r) {
          this.posts.update(list => list.map(v => {
            if (v.post.id !== postId) return v;
            return { ...v, comments: v.comments.map(c =>
              c.comment.id === comment.id ? { ...c, myReaction: r.tipoReaccion } : c
            )};
          }));
        }
      }
    });
  }

  openCommentsModal(vm: PostVM): void {
    if (vm.comments.length === 0) {
      this.loadComments(vm);
    }
    this.modalComments.set(vm.comments);
    this.showCommentsModal.set(true);
  }

  closeCommentsModal(): void {
    this.showCommentsModal.set(false);
  }

  addComment(vm: PostVM): void {
    const userId = this.getUserId();
    const text = vm.newComment.trim();
    if (!userId || !text) return;

    this.commentService.createComment(userId, vm.post.id, text, 'POST').subscribe({
      next: (created: SocialComment) => {
        if (created) {
          const newVm = this.buildCommentVm(created);
          const cached = this.userCache.get(userId);
          newVm.autorNombre = cached?.nombre ?? '';
          newVm.autorAvatar = cached?.avatar ?? '';

          this.posts.update(list => list.map(v => {
            if (v.post.id !== vm.post.id) return v;
            const updated = [...v.comments, newVm];
            return {
              ...v,
              comments: updated,
              post: { ...v.post, estadisticas: { ...v.post.estadisticas, comentariosCount: updated.length } }
            };
          }));
          this.loadCommentAuthor(created.autorId, vm.post.id);
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? { ...v, newComment: '' } : v));
        }
      },
      error: (err) => console.error('Failed to create comment:', err)
    });
  }

  // ─── Comment Reacciones ───

  toggleCommentReactionsDropdown(commentVm: CommentVM): void {
    commentVm.showReactionDropdown = !commentVm.showReactionDropdown;
  }

  selectCommentReaction(commentVm: CommentVM, type: TipoReaccion, postId: string): void {
    this.toggleCommentReaction(commentVm, postId);
    commentVm.showReactionDropdown = false;
  }

  toggleCommentReaction(commentVm: CommentVM, postId: string): void {
    const userId = this.getUserId();
    if (!userId) return;

    const currentCount = commentVm.comment.reaccionesCount ?? 0;

    if (commentVm.myReaction) {
      this.reactionService.unreact(userId, commentVm.comment.id, 'COMMENT').subscribe({
        next: () => {
          this.posts.update(list => list.map(v => {
            if (v.post.id !== postId) return v;
            return { ...v, comments: v.comments.map(c =>
              c.comment.id === commentVm.comment.id ? {
                ...c,
                myReaction: null,
                comment: { ...c.comment, reaccionesCount: Math.max(0, currentCount - 1) }
              } : c
            )};
          }));
        },
        error: (err) => console.error('Failed to unreact comment:', err)
      });
    } else {
      this.reactionService.react(userId, commentVm.comment.id, 'COMMENT', 'LIKE').subscribe({
        next: () => {
          this.posts.update(list => list.map(v => {
            if (v.post.id !== postId) return v;
            return { ...v, comments: v.comments.map(c =>
              c.comment.id === commentVm.comment.id ? {
                ...c,
                myReaction: 'LIKE',
                comment: { ...c.comment, reaccionesCount: currentCount + 1 }
              } : c
            )};
          }));
        },
        error: (err) => console.error('Failed to react comment:', err)
      });
    }
  }

  // ─── Replies ───

  toggleReplyInput(commentVm: CommentVM): void {
    commentVm.showReplyInput = !commentVm.showReplyInput;
  }

  toggleReplies(commentVm: CommentVM): void {
    commentVm.showReplies = !commentVm.showReplies;
    if (commentVm.showReplies && commentVm.replies.length === 0) {
      this.commentService.getReplies(commentVm.comment.id).subscribe({
        next: (replies: SocialComment[]) => {
          commentVm.replies = replies.map(r => this.buildCommentVm(r));
          replies.forEach(r => this.loadReplyAuthor(r.autorId, commentVm.replies));
        },
        error: (err) => console.error('Failed to load replies:', err)
      });
    }
  }

  private loadReplyAuthor(autorId: string, replies: CommentVM[]): void {
    const apply = (info: { nombre: string; avatar: string }) => {
      replies.forEach(r => {
        if (r.comment.autorId === autorId) {
          r.autorNombre = info.nombre;
          r.autorAvatar = info.avatar;
        }
      });
    };

    if (this.userCache.has(autorId)) {
      apply(this.userCache.get(autorId)!);
      return;
    }

    this.graphql.getUser(autorId).subscribe({
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

  addReply(commentVm: CommentVM, postVm: PostVM): void {
    const userId = this.getUserId();
    const text = commentVm.replyText.trim();
    if (!userId || !text) return;

    this.commentService.createComment(userId, postVm.post.id, text, 'POST', commentVm.comment.id).subscribe({
      next: (created: SocialComment) => {
        if (created) {
          const newReply = this.buildCommentVm(created);
          const cached = this.userCache.get(userId);
          newReply.autorNombre = cached?.nombre ?? '';
          newReply.autorAvatar = cached?.avatar ?? '';

          commentVm.replies = [...commentVm.replies, newReply];
          commentVm.replyText = '';
          commentVm.showReplyInput = false;
          commentVm.showReplies = true;
          this.loadReplyAuthor(created.autorId, commentVm.replies);
        }
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
        }
      }
    });
  }

  cancelEdit(vm: PostVM): void {
    this.posts.update(list => list.map(v => v.post.id === vm.post.id ? { ...v, isEditing: false, editText: '' } : v));
  }

  deletePost(vm: PostVM): void {
    this.postService.deletePost(vm.post.id).subscribe({
      next: (ok: boolean) => {
        if (ok) {
          this.posts.update(list => list.filter(p => p.post.id !== vm.post.id));
        }
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  goToProfile(autorId: string): void {
    this.router.navigate(['/profile', autorId]);
  }
}
