import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GraphQLService, User } from '../../../core/services/graphql.service';
import { FollowGraphqlService } from '../../../core/services/social/follow-graphql.service';
import { BlockGraphqlService } from '../../../core/services/social/block-graphql.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.scss',
})
export class PublicProfile implements OnInit {
  user = signal<User | null>(null);
  loading = signal(false);
  errorMessage = signal('');
  isFollowing = signal(false);
  isOwnProfile = signal(false);
  followLoading = signal(false);
  isBlocked = signal(false);
  blockLoading = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private graphql = inject(GraphQLService);
  private followService = inject(FollowGraphqlService);
  private blockService = inject(BlockGraphqlService);

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (userId) {
      this.loadUser(userId);
    }
  }

  loadUser(userId: string): void {
    this.loading.set(true);
    const currentUserId = localStorage.getItem('userId');
    this.isOwnProfile.set(userId === currentUserId);

    this.graphql.getUser(userId).subscribe({
      next: (user: User | null) => {
        this.user.set(user);
        this.loading.set(false);
        if (user && currentUserId && !this.isOwnProfile()) {
          this.checkFollowing(currentUserId, userId);
          this.checkBlocked(currentUserId, userId);
        }
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.errorMessage.set('Usuario no encontrado');
        this.loading.set(false);
      },
    });
  }

  private checkFollowing(followerId: string, followedId: string): void {
    this.followService.isFollowing(followerId, followedId).subscribe({
      next: (result) => this.isFollowing.set(result),
    });
  }

  private checkBlocked(bloqueadorId: string, bloqueadoId: string): void {
    this.blockService.isBlocked(bloqueadorId, bloqueadoId).subscribe({
      next: (result) => this.isBlocked.set(result),
    });
  }

  toggleFollow(): void {
    const currentUserId = localStorage.getItem('userId');
    const targetUserId = this.user()?.id;
    if (!currentUserId || !targetUserId || this.followLoading() || this.isBlocked()) return;

    this.followLoading.set(true);

    if (this.isFollowing()) {
      this.followService.unfollow(currentUserId, targetUserId).subscribe({
        next: () => {
          this.isFollowing.set(false);
          this.followLoading.set(false);
          this.user.update(u => u ? { ...u, seguidoresCount: Math.max(0, (u.seguidoresCount ?? 1) - 1) } : u);
        },
        error: () => this.followLoading.set(false),
      });
    } else {
      this.followService.follow(currentUserId, targetUserId).subscribe({
        next: () => {
          this.isFollowing.set(true);
          this.followLoading.set(false);
          this.user.update(u => u ? { ...u, seguidoresCount: (u.seguidoresCount ?? 0) + 1 } : u);
        },
        error: () => this.followLoading.set(false),
      });
    }
  }

  toggleBlock(): void {
    const currentUserId = localStorage.getItem('userId');
    const targetUserId = this.user()?.id;
    if (!currentUserId || !targetUserId || this.blockLoading()) return;

    this.blockLoading.set(true);

    if (this.isBlocked()) {
      this.blockService.unblock(currentUserId, targetUserId).subscribe({
        next: () => {
          this.isBlocked.set(false);
          this.blockLoading.set(false);
        },
        error: () => this.blockLoading.set(false),
      });
    } else {
      this.blockService.block(currentUserId, targetUserId).subscribe({
        next: () => {
          this.isBlocked.set(true);
          this.blockLoading.set(false);
          if (this.isFollowing()) {
            this.followService.unfollow(currentUserId, targetUserId).subscribe(() => {
              this.isFollowing.set(false);
            });
          }
        },
        error: () => this.blockLoading.set(false),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getInitials(): string {
    const name = this.user()?.nombre || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
