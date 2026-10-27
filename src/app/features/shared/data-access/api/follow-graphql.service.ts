import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { FollowEdge } from '@features/shared/domain/models/follow.model';
import { FollowRepository } from '@features/shared/domain/ports/follow.repository';

const FOLLOW = gql`
  mutation Follow($seguidorId: String!, $tipoSeguido: String!, $seguidoId: String!) {
    follow(seguidorId: $seguidorId, tipoSeguido: $tipoSeguido, seguidoId: $seguidoId) {
      id
      seguidorId
      seguidoId
      createdAt
    }
  }
`;

const UNFOLLOW = gql`
  mutation Unfollow($seguidorId: String!, $tipoSeguido: String!, $seguidoId: String!) {
    unfollow(seguidorId: $seguidorId, tipoSeguido: $tipoSeguido, seguidoId: $seguidoId)
  }
`;

const IS_FOLLOWING = gql`
  query IsFollowing($followerId: String!, $followedId: String!) {
    isFollowing(followerId: $followerId, followedId: $followedId)
  }
`;

const GET_FOLLOWERS = gql`
  query Followers($userId: String!, $page: Int, $size: Int) {
    followers(userId: $userId, page: $page, size: $size) {
      id
      seguidorId
      createdAt
    }
  }
`;

const GET_FOLLOWING = gql`
  query Following($userId: String!, $page: Int, $size: Int) {
    following(userId: $userId, page: $page, size: $size) {
      id
      seguidoId
      createdAt
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class FollowGraphqlService implements FollowRepository {
  private apollo = inject(Apollo);

  follow(seguidorId: string, seguidoId: string): Observable<FollowEdge | null> {
    return this.apollo.mutate({
      mutation: FOLLOW,
      variables: { seguidorId, tipoSeguido: 'USER', seguidoId },
    }).pipe(map((res: any) => res?.data?.follow ?? null));
  }

  unfollow(seguidorId: string, seguidoId: string): Observable<boolean> {
    return this.apollo.mutate({
      mutation: UNFOLLOW,
      variables: { seguidorId, tipoSeguido: 'USER', seguidoId },
    }).pipe(map((res: any) => res?.data?.unfollow ?? false));
  }

  isFollowing(followerId: string, followedId: string): Observable<boolean> {
    return this.apollo.query({
      query: IS_FOLLOWING,
      variables: { followerId, followedId },
    }).pipe(map((res: any) => res?.data?.isFollowing ?? false));
  }

  /** Con size se pide una pagina (50 por defecto en la UI); page arranca en 0. */
  getFollowers(userId: string, page?: number, size?: number): Observable<FollowEdge[]> {
    return this.apollo.query({
      query: GET_FOLLOWERS,
      variables: { userId, page: page ?? null, size: size ?? null },
    }).pipe(map((res: any) => res?.data?.followers ?? []));
  }

  getFollowing(userId: string, page?: number, size?: number): Observable<FollowEdge[]> {
    return this.apollo.query({
      query: GET_FOLLOWING,
      variables: { userId, page: page ?? null, size: size ?? null },
    }).pipe(map((res: any) => res?.data?.following ?? []));
  }
}
