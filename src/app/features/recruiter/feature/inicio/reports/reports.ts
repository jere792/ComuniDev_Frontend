import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PostGraphqlService, SocialPost } from '../../../../../core/services/social/post-graphql.service';
import { CommentGraphqlService, SocialComment } from '../../../../../core/services/social/comment-graphql.service';
import { ReactionGraphqlService, TipoReaccion } from '../../../../../core/services/social/reaction-graphql.service';
import { GraphQLService } from '../../../../../core/services/graphql.service';

interface CommentVM {
  comment: SocialComment;
  autorNombre: string;
  myReaction: TipoReaccion | null;
  replies: CommentVM[];
  showReplies: boolean;
  showReplyInput: boolean;
  replyText: string;
}

interface PostVM {
  post: SocialPost;
  autorNombre: string;
  autorAvatar: string;
  myReaction: TipoReaccion | null;
  showComments: boolean;
  comments: CommentVM[];
  newComment: string;
  isEditing: boolean;
  editText: string;
}

const REACTION_LABELS: Record<TipoReaccion, { icon: string; label: string }> = {
  LIKE: { icon: 'thumb_up', label: 'Me gusta' },
  LOVE: { icon: 'favorite', label: 'Me encanta' },
  CELEBRATE: { icon: 'celebration', label: 'Celebrar' },
  SUPPORT: { icon: 'volunteer_activism', label: 'Apoyar' },
};

@Component({
  selector: 'app-reports',
  imports: [FormsModule, DatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsComponent implements OnInit {
  private postService = inject(PostGraphqlService);
  private commentService = inject(CommentGraphqlService);
  private reactionService = inject(ReactionGraphqlService);
  private graphql = inject(GraphQLService);

  posts = signal<PostVM[]>([]);
  composerText = '';
  composerImage: string | null = null;
  uploadingImage = false;
  loading = signal(true);

  reactionTypes: TipoReaccion[] = ['LIKE', 'LOVE', 'CELEBRATE', 'SUPPORT'];
  reactionLabels = REACTION_LABELS;

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
      newComment: '',
      isEditing: false,
      editText: '',
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
        }
      },
      error: () => {}
    });
  }

  // ─── Reacciones ───

  toggleReaction(vm: PostVM, type: TipoReaccion): void {
    const userId = this.getUserId();
    if (!userId) return;

    const stats = vm.post.estadisticas ?? {};

    if (vm.myReaction === type) {
      this.reactionService.unreact(userId, vm.post.id, 'POST').subscribe({
        next: () => {
          vm.myReaction = null;
          stats.reaccionesCount = Math.max(0, (stats.reaccionesCount ?? 0) - 1);
        },
        error: (err) => console.error('Failed to unreact:', err)
      });
    } else if (vm.myReaction) {
      this.reactionService.react(userId, vm.post.id, 'POST', type).subscribe({
        next: () => { vm.myReaction = type; },
        error: (err) => console.error('Failed to react:', err)
      });
    } else {
      this.reactionService.react(userId, vm.post.id, 'POST', type).subscribe({
        next: () => {
          vm.myReaction = type;
          stats.reaccionesCount = (stats.reaccionesCount ?? 0) + 1;
        },
        error: (err) => console.error('Failed to react:', err)
      });
    }
  }

  // ─── Comentarios ───

  toggleComments(vm: PostVM): void {
    vm.showComments = !vm.showComments;
    if (vm.showComments && vm.comments.length === 0) {
      this.commentService.getComments(vm.post.id, 'POST').subscribe({
        next: (comments: SocialComment[]) => {
          vm.comments = comments.map(c => this.buildCommentVm(c));
          comments.forEach(c => this.loadCommentAuthor(c.autorId, vm));
        },
        error: (err) => {
          console.error('Failed to load comments:', err);
        }
      });
    }
  }

  private buildCommentVm(comment: SocialComment): CommentVM {
    return {
      comment,
      autorNombre: '',
      myReaction: null,
      replies: [],
      showReplies: false,
      showReplyInput: false,
      replyText: '',
    };
  }

  private loadCommentAuthor(autorId: string, vm: PostVM): void {
    this.graphql.getUser(autorId).subscribe({
      next: (user: any) => {
        if (user) {
          vm.comments = vm.comments.map(c => c.comment.autorId === autorId ? { ...c, autorNombre: user.nombre ?? 'Usuario' } : c);
        }
      },
      error: () => {}
    });
  }

  addComment(vm: PostVM): void {
    const userId = this.getUserId();
    const text = vm.newComment.trim();
    if (!userId || !text) return;

    this.commentService.createComment(userId, vm.post.id, text, 'POST').subscribe({
      next: (created: SocialComment) => {
        if (created) {
          vm.comments = [...vm.comments, this.buildCommentVm(created)];
          this.loadCommentAuthor(created.autorId, vm);
          vm.newComment = '';
          if (!vm.post.estadisticas) vm.post.estadisticas = {};
          vm.post.estadisticas.comentariosCount = (vm.post.estadisticas.comentariosCount ?? 0) + 1;
        }
      },
      error: (err) => {
        console.error('Failed to create comment:', err);
      }
    });
  }

  toggleReplyInput(commentVm: CommentVM): void {
    commentVm.showReplyInput = !commentVm.showReplyInput;
  }

  toggleReplies(commentVm: CommentVM): void {
    commentVm.showReplies = !commentVm.showReplies;
    if (commentVm.showReplies && commentVm.replies.length === 0) {
      this.commentService.getReplies(commentVm.comment.id).subscribe({
        next: (replies: SocialComment[]) => {
          commentVm.replies = replies.map(r => this.buildCommentVm(r));
        },
        error: (err) => {
          console.error('Failed to load replies:', err);
        }
      });
    }
  }

  addReply(commentVm: CommentVM, postVm: PostVM): void {
    const userId = this.getUserId();
    const text = commentVm.replyText.trim();
    if (!userId || !text) return;

    this.commentService.createComment(userId, postVm.post.id, text, 'POST', commentVm.comment.id).subscribe({
      next: (created: SocialComment) => {
        if (created) {
          commentVm.replies = [...commentVm.replies, this.buildCommentVm(created)];
          commentVm.replyText = '';
          commentVm.showReplyInput = false;
          commentVm.showReplies = true;
        }
      },
      error: (err) => {
        console.error('Failed to create reply:', err);
      }
    });
  }

  toggleCommentReaction(commentVm: CommentVM): void {
    const userId = this.getUserId();
    if (!userId) return;

    if (commentVm.myReaction) {
      this.reactionService.unreact(userId, commentVm.comment.id, 'COMMENT').subscribe({
        next: () => {
          commentVm.myReaction = null;
          commentVm.comment.reaccionesCount = Math.max(0, (commentVm.comment.reaccionesCount ?? 0) - 1);
        },
        error: (err) => console.error('Failed to unreact comment:', err)
      });
    } else {
      this.reactionService.react(userId, commentVm.comment.id, 'COMMENT', 'LIKE').subscribe({
        next: () => {
          commentVm.myReaction = 'LIKE';
          commentVm.comment.reaccionesCount = (commentVm.comment.reaccionesCount ?? 0) + 1;
        },
        error: (err) => console.error('Failed to react comment:', err)
      });
    }
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
          vm.post.contenido = { ...vm.post.contenido, texto: vm.editText.trim() };
          vm.isEditing = false;
        }
      }
    });
  }

  cancelEdit(vm: PostVM): void {
    vm.isEditing = false;
    vm.editText = '';
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
}
