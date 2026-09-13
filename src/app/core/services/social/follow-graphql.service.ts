import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

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
  query Followers($userId: String!) {
    followers(userId: $userId) {
      id
      seguidorId
      createdAt
    }
  }
`;

const GET_FOLLOWING = gql`
  query Following($userId: String!) {
    following(userId: $userId) {
      id
      seguidoId
      createdAt
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class FollowGraphqlService {
  private apollo = inject(Apollo);

  follow(seguidorId: string, seguidoId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: FOLLOW,
      variables: { seguidorId, tipoSeguido: 'USER', seguidoId },
    }).pipe(map((res: any) => res?.data?.follow));
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

  getFollowers(userId: string): Observable<any[]> {
    return this.apollo.query({
      query: GET_FOLLOWERS,
      variables: { userId },
    }).pipe(map((res: any) => res?.data?.followers ?? []));
  }

  getFollowing(userId: string): Observable<any[]> {
    return this.apollo.query({
      query: GET_FOLLOWING,
      variables: { userId },
    }).pipe(map((res: any) => res?.data?.following ?? []));
  }
}
