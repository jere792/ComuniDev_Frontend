import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SocialComment } from '@features/shared/domain/models/social-comment.model';
import { CommentRepository } from '@features/shared/domain/ports/comment.repository';

const GET_COMMENTS = gql`
  query GetComments($contentId: String!, $contentType: String!, $limit: Int) {
    comments(contentId: $contentId, contentType: $contentType, limit: $limit) {
      id
      autorId
      contenidoId
      tipoContenido
      parentCommentId
      texto
      imagenes
      estadoModeracion
      reaccionesCount
      repliesCount
      createdAt
    }
  }
`;

const GET_REPLIES = gql`
  query GetReplies($parentCommentId: String!, $limit: Int) {
    commentReplies(parentCommentId: $parentCommentId, limit: $limit) {
      id
      autorId
      contenidoId
      tipoContenido
      parentCommentId
      texto
      imagenes
      estadoModeracion
      reaccionesCount
      repliesCount
      createdAt
    }
  }
`;

const GET_COMMENT_COUNT = gql`
  query GetCommentCount($contentId: String!, $contentType: String!) {
    commentCount(contentId: $contentId, contentType: $contentType)
  }
`;

const GET_COMMENTS_FOR_POSTS = gql`
  query GetCommentsForPosts($contentIds: [String!]!, $contentType: String!) {
    commentsForPosts(contentIds: $contentIds, contentType: $contentType) {
      id
      autorId
      contenidoId
      tipoContenido
      parentCommentId
      texto
      imagenes
      estadoModeracion
      reaccionesCount
      repliesCount
      createdAt
    }
  }
`;

const GET_COMMENT_COUNTS = gql`
  query GetCommentCounts($contentIds: [String!]!, $contentType: String!) {
    commentCounts(contentIds: $contentIds, contentType: $contentType) {
      contentId
      count
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($autorId: String!, $contenidoId: String!, $tipoContenido: String!, $parentCommentId: String, $texto: String!, $imagenes: [String]) {
    createComment(autorId: $autorId, contenidoId: $contenidoId, tipoContenido: $tipoContenido, parentCommentId: $parentCommentId, texto: $texto, imagenes: $imagenes) {
      id
      autorId
      contenidoId
      tipoContenido
      parentCommentId
      texto
      imagenes
      estadoModeracion
      reaccionesCount
      repliesCount
      createdAt
    }
  }
`;

const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: ID!, $texto: String, $imagenes: [String]) {
    updateComment(id: $id, texto: $texto, imagenes: $imagenes) {
      id
      texto
      imagenes
    }
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

@Injectable({ providedIn: 'root' })
export class CommentGraphqlService implements CommentRepository {
  private apollo = inject(Apollo);


  /** Ventana de comentarios (100 por defecto); el backend pagina con before/limit. */
  getComments(contentId: string, contentType = 'POST', limit = 100): Observable<SocialComment[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_COMMENTS, variables: { contentId, contentType, limit } })
      .valueChanges.pipe(map(result => result.data?.comments ?? []));
  }

  getReplies(parentCommentId: string, limit = 100): Observable<SocialComment[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_REPLIES, variables: { parentCommentId, limit } })
      .valueChanges.pipe(map(result => result.data?.commentReplies ?? []));
  }

  countComments(contentId: string, contentType = 'POST'): Observable<number> {
    return this.apollo
      .query<any>({ query: GET_COMMENT_COUNT, variables: { contentId, contentType }, fetchPolicy: 'network-only' })
      .pipe(map(result => result.data?.commentCount ?? 0));
  }

  /** Comentarios raiz de varios posts en UNA peticion (antes: una por post). */
  getCommentsBatch(contentIds: string[], contentType = 'POST'): Observable<SocialComment[]> {
    if (contentIds.length === 0) return of([]);
    return this.apollo
      .query<any>({ query: GET_COMMENTS_FOR_POSTS, variables: { contentIds, contentType }, fetchPolicy: 'network-only' })
      .pipe(map(result => result.data?.commentsForPosts ?? []));
  }

  /** Contadores de comentarios de varios posts en UNA peticion. */
  countCommentsBatch(contentIds: string[], contentType = 'POST'): Observable<Array<{ contentId: string; count: number }>> {
    if (contentIds.length === 0) return of([]);
    return this.apollo
      .query<any>({ query: GET_COMMENT_COUNTS, variables: { contentIds, contentType }, fetchPolicy: 'network-only' })
      .pipe(map(result => result.data?.commentCounts ?? []));
  }

  createComment(autorId: string, contenidoId: string, texto: string, tipoContenido = 'POST', parentCommentId?: string): Observable<SocialComment> {
    return this.apollo
      .mutate<any>({ mutation: CREATE_COMMENT, variables: { autorId, contenidoId, tipoContenido, parentCommentId, texto } })
      .pipe(map(result => result.data?.createComment));
  }

  updateComment(id: string, texto?: string, imagenes?: string[]): Observable<SocialComment> {
    return this.apollo
      .mutate<any>({ mutation: UPDATE_COMMENT, variables: { id, texto, imagenes } })
      .pipe(map(result => result.data?.updateComment));
  }

  deleteComment(id: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: DELETE_COMMENT, variables: { id } })
      .pipe(map(result => result.data?.deleteComment ?? false));
  }
}
