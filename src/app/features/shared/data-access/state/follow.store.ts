import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FollowEdge } from '@features/shared/domain/models/follow.model';
import { FOLLOW_REPOSITORY, FollowRepository } from '@features/shared/domain/ports/follow.repository';

@Injectable({ providedIn: 'root' })
export class FollowStore {
  private repository = inject<FollowRepository>(FOLLOW_REPOSITORY);

  readonly followers = signal<FollowEdge[]>([]);
  readonly following = signal<FollowEdge[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  follow(seguidorId: string, seguidoId: string): Observable<FollowEdge | null> {
    return this.repository.follow(seguidorId, seguidoId);
  }

  unfollow(seguidorId: string, seguidoId: string): Observable<boolean> {
    return this.repository.unfollow(seguidorId, seguidoId);
  }

  isFollowing(followerId: string, followedId: string): Observable<boolean> {
    return this.repository.isFollowing(followerId, followedId);
  }

  loadFollowers(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getFollowers(userId).subscribe({
      next: (followers) => {
        this.followers.set(followers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar seguidores');
        this.loading.set(false);
      },
    });
  }

  loadFollowing(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getFollowing(userId).subscribe({
      next: (following) => {
        this.following.set(following);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar seguidos');
        this.loading.set(false);
      },
    });
  }

  getFollowers(userId: string): Observable<FollowEdge[]> {
    return this.repository.getFollowers(userId);
  }

  getFollowing(userId: string): Observable<FollowEdge[]> {
    return this.repository.getFollowing(userId);
  }

  clear(): void {
    this.followers.set([]);
    this.following.set([]);
    this.error.set(null);
  }
}
