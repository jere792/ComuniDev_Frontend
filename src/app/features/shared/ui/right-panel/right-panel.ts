import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GraphQLService } from '../../../../core/services/graphql.service';
import { FollowGraphqlService } from '../../../../core/services/social/follow-graphql.service';

@Component({
  selector: 'app-shared-right-panel',
  standalone: true,
  imports: [],
  templateUrl: './right-panel.html',
  styleUrl: './right-panel.scss',
})
export class SharedRightPanel implements OnInit {
  @Input() role: string = localStorage.getItem('role') || 'developer';
  userName = localStorage.getItem('userName') || 'Usuario';
  userPhoto = signal(localStorage.getItem('userPhoto') || '');
  userUsername = signal(localStorage.getItem('userUsername') || '');
  suggestions = signal<any[]>([]);

  private graphql = inject(GraphQLService);
  private followService = inject(FollowGraphqlService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadSuggestions();
    if (!this.userPhoto()) {
      this.loadCurrentUser();
    }
  }

  private loadCurrentUser(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.graphql.getUser(userId).subscribe({
      next: (user: any) => {
        if (user) {
          if (user.fotoPerfilUrl) {
            this.userPhoto.set(user.fotoPerfilUrl);
            localStorage.setItem('userPhoto', user.fotoPerfilUrl);
          }
          if (user.nombreUsuario) {
            this.userUsername.set(user.nombreUsuario);
            localStorage.setItem('userUsername', user.nombreUsuario);
          }
          if (user.nombre) {
            this.userName = user.nombre;
            localStorage.setItem('userName', user.nombre);
          }
        }
      }
    });
  }

  private loadSuggestions(): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    this.graphql.getUsers().subscribe({
      next: (users: any[]) => {
        const others = users.filter(u => u.id !== currentUserId).slice(0, 5);
        const enriched = others.map(u => ({
          ...u,
          isFollowing: false,
        }));
        this.suggestions.set(enriched);
        enriched.forEach((s, i) => {
          this.followService.isFollowing(currentUserId, s.id).subscribe({
            next: (result) => {
              this.suggestions.update(list => list.map((item, j) =>
                j === i ? { ...item, isFollowing: result } : item
              ));
            },
          });
        });
      },
    });
  }

  toggleFollow(suggestion: any): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    if (suggestion.isFollowing) {
      this.followService.unfollow(currentUserId, suggestion.id).subscribe({
        next: () => {
          this.suggestions.update(list => list.map(s =>
            s.id === suggestion.id ? { ...s, isFollowing: false } : s
          ));
        },
      });
    } else {
      this.followService.follow(currentUserId, suggestion.id).subscribe({
        next: () => {
          this.suggestions.update(list => list.map(s =>
            s.id === suggestion.id ? { ...s, isFollowing: true } : s
          ));
        },
      });
    }
  }

  goToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  goToDiscover(): void {
    const role = localStorage.getItem('role') || 'developer';
    this.router.navigate(['/' + role, 'discover']);
  }
}
