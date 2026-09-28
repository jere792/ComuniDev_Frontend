import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialComment } from '@features/shared/domain/models/social-comment.model';
import { COMMENT_REPOSITORY, CommentRepository } from '@features/shared/domain/ports/comment.repository';

@Injectable({ providedIn: 'root' })
export class CommentStore {
  private repository = inject<CommentRepository>(COMMENT_REPOSITORY);

  readonly comments = signal<SocialComment[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadComments(contentId: string, contentType = 'POST'): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getComments(contentId, contentType).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar comentarios');
        this.loading.set(false);
      },
    });
  }

  getComments(contentId: string, contentType = 'POST'): Observable<SocialComment[]> {
    return this.repository.getComments(contentId, contentType);
  }

  getReplies(parentCommentId: string): Observable<SocialComment[]> {
    return this.repository.getReplies(parentCommentId);
  }

  countComments(contentId: string, contentType = 'POST'): Observable<number> {
    return this.repository.countComments(contentId, contentType);
  }

  createComment(
    autorId: string,
    contenidoId: string,
    texto: string,
    tipoContenido = 'POST',
    parentCommentId?: string
  ): Observable<SocialComment> {
    return this.repository.createComment(autorId, contenidoId, texto, tipoContenido, parentCommentId);
  }

  updateComment(id: string, texto?: string, imagenes?: string[]): Observable<SocialComment> {
    return this.repository.updateComment(id, texto, imagenes);
  }

  deleteComment(id: string): Observable<boolean> {
    return this.repository.deleteComment(id);
  }

  clear(): void {
    this.comments.set([]);
    this.error.set(null);
  }
}
