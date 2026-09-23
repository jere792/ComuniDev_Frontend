import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SocialComment } from '@features/shared/domain/models/social-comment.model';
import { CommentRepository } from '@features/shared/domain/ports/comment.repository';

const GET_COMMENTS = gql`
  query GetComments($contentId: String!, $contentType: String!) {
    comments(contentId: $contentId, contentType: $contentType) {
      id
      autorId
      contenidoId
      tipoContenido
      parentCommentId
      texto
      imagenes
      estadoModeracion
      reaccionesCount
      createdAt
    }
  }
`;

const GET_REPLIES = gql`
  query GetReplies($parentCommentId: String!) {
    commentReplies(parentCommentId: $parentCommentId) {
      id
      autorId
      contenidoId
      tipoContenido
      parentCommentId
      texto
      imagenes
      estadoModeracion
      reaccionesCount
      createdAt
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


  getComments(contentId: string, contentType = 'POST'): Observable<SocialComment[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_COMMENTS, variables: { contentId, contentType } })
      .valueChanges.pipe(map(result => result.data?.comments ?? []));
  }

  getReplies(parentCommentId: string): Observable<SocialComment[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_REPLIES, variables: { parentCommentId } })
      .valueChanges.pipe(map(result => result.data?.commentReplies ?? []));
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
