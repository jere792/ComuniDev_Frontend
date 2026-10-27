import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialComment } from '@features/shared/domain/models/social-comment.model';

export interface CommentRepository {
  getComments(contentId: string, contentType?: string): Observable<SocialComment[]>;
  getReplies(parentCommentId: string): Observable<SocialComment[]>;
  countComments(contentId: string, contentType?: string): Observable<number>;
  /** Comentarios raiz de varios posts en una sola peticion. */
  getCommentsBatch(contentIds: string[], contentType?: string): Observable<SocialComment[]>;
  /** Contadores de comentarios de varios posts en una sola peticion. */
  countCommentsBatch(contentIds: string[], contentType?: string): Observable<Array<{ contentId: string; count: number }>>;
  createComment(
    autorId: string,
    contenidoId: string,
    texto: string,
    tipoContenido?: string,
    parentCommentId?: string
  ): Observable<SocialComment>;
  updateComment(id: string, texto?: string, imagenes?: string[]): Observable<SocialComment>;
  deleteComment(id: string): Observable<boolean>;
}

export const COMMENT_REPOSITORY = new InjectionToken<CommentRepository>('CommentRepository');
