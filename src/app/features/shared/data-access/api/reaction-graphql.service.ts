import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SocialReaction, TipoReaccion } from '@features/shared/domain/models/social-reaction.model';
import { ReactionRepository } from '@features/shared/domain/ports/reaction.repository';

const GET_REACTIONS = gql`
  query GetReactions($targetId: String!, $targetType: String!) {
    reactions(targetId: $targetId, targetType: $targetType) {
      id
      usuarioId
      objetivoId
      tipoObjetivo
      tipoReaccion
      createdAt
    }
  }
`;

const GET_MY_REACTION = gql`
  query GetMyReaction($userId: String!, $targetId: String!, $targetType: String!) {
    myReaction(userId: $userId, targetId: $targetId, targetType: $targetType) {
      id
      usuarioId
      objetivoId
      tipoObjetivo
      tipoReaccion
      createdAt
    }
  }
`;

const REACT = gql`
  mutation React($usuarioId: String!, $objetivoId: String!, $tipoObjetivo: String!, $tipoReaccion: TipoReaccion!) {
    react(usuarioId: $usuarioId, objetivoId: $objetivoId, tipoObjetivo: $tipoObjetivo, tipoReaccion: $tipoReaccion) {
      id
      usuarioId
      objetivoId
      tipoObjetivo
      tipoReaccion
      createdAt
    }
  }
`;

const UNREACT = gql`
  mutation Unreact($usuarioId: String!, $objetivoId: String!, $tipoObjetivo: String!) {
    unreact(usuarioId: $usuarioId, objetivoId: $objetivoId, tipoObjetivo: $tipoObjetivo)
  }
`;

@Injectable({ providedIn: 'root' })
export class ReactionGraphqlService implements ReactionRepository {
  private apollo = inject(Apollo);


  getReactions(targetId: string, targetType: string): Observable<SocialReaction[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_REACTIONS, variables: { targetId, targetType } })
      .valueChanges.pipe(map(result => result.data?.reactions ?? []));
  }

  getMyReaction(userId: string, targetId: string, targetType: string): Observable<SocialReaction | null> {
    return this.apollo
      .watchQuery<any>({ query: GET_MY_REACTION, variables: { userId, targetId, targetType } })
      .valueChanges.pipe(map(result => result.data?.myReaction ?? null));
  }

  react(usuarioId: string, objetivoId: string, tipoObjetivo: string, tipoReaccion: TipoReaccion): Observable<SocialReaction> {
    return this.apollo
      .mutate<any>({ mutation: REACT, variables: { usuarioId, objetivoId, tipoObjetivo, tipoReaccion } })
      .pipe(map(result => result.data?.react));
  }

  unreact(usuarioId: string, objetivoId: string, tipoObjetivo: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: UNREACT, variables: { usuarioId, objetivoId, tipoObjetivo } })
      .pipe(map(result => result.data?.unreact ?? false));
  }
}
