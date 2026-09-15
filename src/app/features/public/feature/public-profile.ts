import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GraphQLService, User } from '../../../core/services/graphql.service';
import { ConnectionGraphqlService, ConnectionStatus } from '../../../core/services/social/connection-graphql.service';
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
  connectionStatus = signal<ConnectionStatus>({ status: 'NONE' });
  isOwnProfile = signal(false);
  connectionLoading = signal(false);
  isBlocked = signal(false);
  blockLoading = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private graphql = inject(GraphQLService);
  private connectionService = inject(ConnectionGraphqlService);
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
          this.checkConnectionStatus(currentUserId, userId);
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

  private checkConnectionStatus(userId: string, otherUserId: string): void {
    this.connectionService.getConnectionStatus(userId, otherUserId).subscribe({
      next: (status) => this.connectionStatus.set(status),
    });
  }

  private checkBlocked(bloqueadorId: string, bloqueadoId: string): void {
    this.blockService.isBlocked(bloqueadorId, bloqueadoId).subscribe({
      next: (result) => this.isBlocked.set(result),
    });
  }

  handleConnection(): void {
    const currentUserId = localStorage.getItem('userId');
    const targetUserId = this.user()?.id;
    if (!currentUserId || !targetUserId || this.connectionLoading() || this.isBlocked()) return;

    const status = this.connectionStatus().status;

    if (status === 'NONE') {
      this.connectionLoading.set(true);
      this.connectionService.sendRequest(currentUserId, targetUserId).subscribe({
        next: () => {
          this.connectionStatus.set({ status: 'PENDING_SENT' });
          this.connectionLoading.set(false);
        },
        error: () => this.connectionLoading.set(false),
      });
    } else if (status === 'PENDING_RECEIVED') {
      const requestId = this.connectionStatus().requestId;
      if (requestId) {
        this.connectionLoading.set(true);
        this.connectionService.acceptConnection(requestId).subscribe({
          next: (conn) => {
            this.connectionStatus.set({ status: 'CONNECTED', connectionId: conn?.id });
            this.connectionLoading.set(false);
            this.user.update(u => u ? { ...u, conexionesCount: (u.conexionesCount ?? 0) + 1 } : u);
          },
          error: () => this.connectionLoading.set(false),
        });
      }
    } else if (status === 'CONNECTED') {
      const connectionId = this.connectionStatus().connectionId;
      if (connectionId) {
        this.connectionLoading.set(true);
        this.connectionService.removeConnection(connectionId).subscribe({
          next: () => {
            this.connectionStatus.set({ status: 'NONE' });
            this.connectionLoading.set(false);
            this.user.update(u => u ? { ...u, conexionesCount: Math.max(0, (u.conexionesCount ?? 1) - 1) } : u);
          },
          error: () => this.connectionLoading.set(false),
        });
      }
    }
  }

  rejectRequest(): void {
    const requestId = this.connectionStatus().requestId;
    if (!requestId) return;

    this.connectionLoading.set(true);
    this.connectionService.rejectConnection(requestId).subscribe({
      next: () => {
        this.connectionStatus.set({ status: 'NONE' });
        this.connectionLoading.set(false);
      },
      error: () => this.connectionLoading.set(false),
    });
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
          if (this.connectionStatus().status === 'CONNECTED') {
            const connectionId = this.connectionStatus().connectionId;
            if (connectionId) {
              this.connectionService.removeConnection(connectionId).subscribe(() => {
                this.connectionStatus.set({ status: 'NONE' });
              });
            }
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
