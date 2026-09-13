import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ReelGraphqlService, SocialReel } from '../../../../core/services/social/reel-graphql.service';
import { ReactionGraphqlService, TipoReaccion } from '../../../../core/services/social/reaction-graphql.service';
import { CommentGraphqlService, SocialComment } from '../../../../core/services/social/comment-graphql.service';
import { GraphQLService } from '../../../../core/services/graphql.service';

interface ReelVM {
  reel: SocialReel;
  autorNombre: string;
  autorAvatar: string;
  myReaction: TipoReaccion | null;
  saved: boolean;
  showComments: boolean;
  comments: { comment: SocialComment; autorNombre: string }[];
  newComment: string;
}

@Component({
  selector: 'app-recruiter-reels',
  imports: [FormsModule, DatePipe],
  templateUrl: './reels.html',
  styleUrl: './reels.scss',
})
export class RecruiterReels implements OnInit {
  private reelService = inject(ReelGraphqlService);
  private reactionService = inject(ReactionGraphqlService);
  private commentService = inject(CommentGraphqlService);
  private graphql = inject(GraphQLService);

  reels = signal<ReelVM[]>([]);
  currentIndex = 0;
  loading = signal(true);

  // Composer
  showComposer = signal(false);
  reelVideoUrl = '';
  reelDescripcion = '';
  reelEtiquetas = '';
  creating = false;

  private userCache = new Map<string, { nombre: string; avatar: string }>();

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  ngOnInit(): void {
    this.reelService.getReels().subscribe({
      next: (data: SocialReel[]) => {
        this.reels.set(data.map(r => this.buildVm(r)));
        this.loading.set(false);
        data.forEach(r => this.loadAuthor(r.autorId));
        this.loadMyReactions(data);
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

  // ─── Composer ───

  toggleComposer(): void {
    this.showComposer.update(v => !v);
  }

  createReel(): void {
    const userId = this.getUserId();
    if (!userId || !this.reelVideoUrl.trim()) return;

    this.creating = true;
    const etiquetas = this.reelEtiquetas
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    this.reelService.createReel({
      autorId: userId,
      videoUrl: this.reelVideoUrl.trim(),
      descripcion: this.reelDescripcion.trim() || undefined,
      etiquetas: etiquetas.length > 0 ? etiquetas : undefined,
    }).subscribe({
      next: (created: SocialReel) => {
        if (created) {
          this.reels.update(list => [this.buildVm(created), ...list]);
          this.loadAuthor(created.autorId);
          this.reelVideoUrl = '';
          this.reelDescripcion = '';
          this.reelEtiquetas = '';
          this.showComposer.set(false);
          this.currentIndex = 0;
        }
        this.creating = false;
      },
      error: () => {
        this.creating = false;
      }
    });
  }

  // ─── Navegación ───

  nextReel(): void {
    if (this.currentIndex < this.reels().length - 1) {
      this.currentIndex++;
    }
  }

  prevReel(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  // ─── Reacciones ───

  toggleLike(vm: ReelVM): void {
    const userId = this.getUserId();
    if (!userId) return;

    const stats = vm.reel.estadisticas ?? {};

    if (vm.myReaction) {
      this.reactionService.unreact(userId, vm.reel.id, 'REEL').subscribe(() => {
        vm.myReaction = null;
        stats.reaccionesCount = Math.max(0, (stats.reaccionesCount ?? 0) - 1);
      });
    } else {
      this.reactionService.react(userId, vm.reel.id, 'REEL', 'LIKE').subscribe(() => {
        vm.myReaction = 'LIKE';
        stats.reaccionesCount = (stats.reaccionesCount ?? 0) + 1;
      });
    }
  }

  toggleSave(vm: ReelVM): void {
    vm.saved = !vm.saved;
  }

  // ─── Comentarios ───

  toggleComments(vm: ReelVM): void {
    vm.showComments = !vm.showComments;
    if (vm.showComments && vm.comments.length === 0) {
      this.commentService.getComments(vm.reel.id, 'REEL').subscribe({
        next: (comments: SocialComment[]) => {
          vm.comments = comments.map(c => ({ comment: c, autorNombre: '' }));
          comments.forEach(c => this.loadCommentAuthor(c.autorId, vm));
        }
      });
    }
  }

  private loadCommentAuthor(autorId: string, vm: ReelVM): void {
    this.graphql.getUser(autorId).subscribe({
      next: (user: any) => {
        if (user) {
          vm.comments = vm.comments.map(c =>
            c.comment.autorId === autorId ? { ...c, autorNombre: user.nombre ?? 'Usuario' } : c
          );
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
          vm.comments = [...vm.comments, { comment: created, autorNombre: 'Tú' }];
          vm.newComment = '';
          if (!vm.reel.estadisticas) vm.reel.estadisticas = {};
          vm.reel.estadisticas.comentariosCount = (vm.reel.estadisticas.comentariosCount ?? 0) + 1;
        }
      }
    });
  }

  deleteReel(vm: ReelVM): void {
    this.reelService.deleteReel(vm.reel.id).subscribe({
      next: (ok: boolean) => {
        if (ok) {
          this.reels.update(list => list.filter(r => r.reel.id !== vm.reel.id));
          if (this.currentIndex >= this.reels().length) {
            this.currentIndex = Math.max(0, this.reels().length - 1);
          }
        }
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
