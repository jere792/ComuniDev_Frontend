import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GraphQLService, User } from '../../../../core/services/graphql.service';
import { FollowGraphqlService } from '../../../../core/services/social/follow-graphql.service';

interface UserWithFollow extends User {
  isFollowing: boolean;
  followers: { seguidorId: string }[];
}

@Component({
  selector: 'app-discover-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discover-users.html',
  styleUrl: './discover-users.scss',
})
export class DiscoverUsers implements OnInit {
  users = signal<UserWithFollow[]>([]);
  loading = signal(true);

  private graphql = inject(GraphQLService);
  private followService = inject(FollowGraphqlService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    this.graphql.getUsers().subscribe({
      next: (users: User[]) => {
        const others = users.filter(u => u.id !== currentUserId);
        const enriched = others.map(u => ({ ...u, isFollowing: false, followers: [] }));
        this.users.set(enriched);
        this.loading.set(false);
        enriched.forEach((u, i) => {
          this.followService.isFollowing(currentUserId, u.id!).subscribe({
            next: (result) => {
              this.users.update(list => list.map((item, j) =>
                j === i ? { ...item, isFollowing: result } : item
              ));
            },
          });
        });
      },
      error: () => this.loading.set(false),
    });
  }

  toggleFollow(user: UserWithFollow): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId || !user.id) return;

    if (user.isFollowing) {
      this.followService.unfollow(currentUserId, user.id).subscribe({
        next: () => {
          this.users.update(list => list.map(u =>
            u.id === user.id ? { ...u, isFollowing: false } : u
          ));
        },
      });
    } else {
      this.followService.follow(currentUserId, user.id).subscribe({
        next: () => {
          this.users.update(list => list.map(u =>
            u.id === user.id ? { ...u, isFollowing: true } : u
          ));
        },
      });
    }
  }

  goToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
