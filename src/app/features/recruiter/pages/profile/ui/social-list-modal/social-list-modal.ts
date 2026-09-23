import { Component, Input, Output, EventEmitter, OnInit, OnChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GraphQLService, User } from '../../../../../../core/services/graphql.service';
import { FollowGraphqlService } from '../../../../../../core/services/social/follow-graphql.service';
import { ConnectionGraphqlService } from '../../../../../../core/services/social/connection-graphql.service';

export type SocialListType = 'followers' | 'following' | 'connections';

@Component({
  selector: 'app-social-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './social-list-modal.html',
  styleUrl: './social-list-modal.scss',
})
export class SocialListModal implements OnInit, OnChanges {
  @Input({ required: true }) open = false;
  @Input({ required: true }) type: SocialListType = 'followers';
  @Input({ required: true }) userId = '';
  @Output() close = new EventEmitter<void>();

  loading = signal(true);
  users = signal<User[]>([]);
  search = signal('');

  private graphql = inject(GraphQLService);
  private followService = inject(FollowGraphqlService);
  private connService = inject(ConnectionGraphqlService);
  private router = inject(Router);

  get modalTitle(): string {
    switch (this.type) {
      case 'followers': return 'Seguidores';
      case 'following': return 'Siguiendo';
      case 'connections': return 'Conexiones';
      default: return '';
    }
  }

  filteredUsers = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.users();
    if (!term) return list;
    return list.filter(u =>
      (u.nombre || '').toLowerCase().includes(term) ||
      (u.nombreUsuario || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    if (this.open) {
      this.load();
    }
  }

  ngOnChanges(): void {
    if (this.open && this.userId) {
      this.load();
    }
    if (!this.open) {
      this.search.set('');
    }
  }

  load(): void {
    if (!this.userId) return;
    this.loading.set(true);
    this.users.set([]);

    if (this.type === 'followers') {
      this.followService.getFollowers(this.userId).subscribe({
        next: (follows) => {
          const ids = follows.map(f => f.seguidorId).filter(Boolean);
          this.resolveUsers(ids);
        },
        error: () => this.loading.set(false),
      });
    } else if (this.type === 'following') {
      this.followService.getFollowing(this.userId).subscribe({
        next: (follows) => {
          const ids = follows.map(f => f.seguidoId).filter(Boolean);
          this.resolveUsers(ids);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.connService.getConnections(this.userId).subscribe({
        next: (conns) => {
          const ids = conns.map(c =>
            c.usuarioMenorId === this.userId ? c.usuarioMayorId : c.usuarioMenorId
          ).filter(Boolean);
          this.resolveUsers(ids);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  private resolveUsers(ids: string[]): void {
    if (ids.length === 0) {
      this.users.set([]);
      this.loading.set(false);
      return;
    }
    this.graphql.getUsers().subscribe({
      next: (all: User[]) => {
        const idSet = new Set(ids);
        this.users.set(all.filter(u => u.id && idSet.has(u.id)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.set(value);
  }

  goToProfile(userId?: string): void {
    if (!userId) return;
    this.close.emit();
    this.router.navigate(['/profile', userId]);
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
