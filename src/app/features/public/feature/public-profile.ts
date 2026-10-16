import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserStore } from '@features/users/data-access/state/user.store';
import { User } from '@core/domain/models/user.model';
import { ConnectionStore } from '@features/shared/data-access/state/connection.store';
import { ConnectionStatus } from '@features/shared/domain/models/connection.model';
import { BLOCK_REPOSITORY, BlockRepository } from '@features/shared/domain/ports/block.repository';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, ConfirmModal],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.scss',
})
export class PublicProfile implements OnInit {
  user = signal<User | null>(null);
  loading = signal(false);
  connectionStatus = signal<ConnectionStatus>({ status: 'NONE' });
  isOwnProfile = signal(false);
  connectionLoading = signal(false);
  isBlocked = signal(false);
  blockLoading = signal(false);
  removeConfirmOpen = signal(false);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private userStore = inject(UserStore);
  private connectionService = inject(ConnectionStore);
  private blockService = inject<BlockRepository>(BLOCK_REPOSITORY);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

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

    this.userStore.getById(userId).subscribe({
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
        this.toast.error('Usuario no encontrado');
        this.loading.set(false);
      },
    });
  }

  private checkConnectionStatus(userId: string, otherUserId: string): void {
    this.connectionService.getConnectionStatus(userId, otherUserId).subscribe({
      next: (status) => this.connectionStatus.set(status),
    });

    this.connectionService
      .subscribeToConnectionStatus(userId)
      .pipe(
        filter((event) => event.otherUserId === otherUserId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((status) => this.connectionStatus.set(status));
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
          this.toast.success('Solicitud de conexión enviada');
        },
        error: () => {
          this.connectionLoading.set(false);
          this.toast.error('Error al enviar solicitud');
        },
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
            this.toast.success('Conexión aceptada');
          },
          error: () => {
            this.connectionLoading.set(false);
            this.toast.error('Error al aceptar conexión');
          },
        });
      }
    } else if (status === 'CONNECTED') {
      this.removeConfirmOpen.set(true);
    }
  }

  onCancelRemoveConnection(): void {
    this.removeConfirmOpen.set(false);
  }

  onConfirmRemoveConnection(): void {
    this.removeConfirmOpen.set(false);
    const connectionId = this.connectionStatus().connectionId;
    if (!connectionId) return;

    this.connectionLoading.set(true);
    this.connectionService.removeConnection(connectionId).subscribe({
      next: () => {
        this.connectionStatus.set({ status: 'NONE' });
        this.connectionLoading.set(false);
        this.user.update(u => u ? { ...u, conexionesCount: Math.max(0, (u.conexionesCount ?? 1) - 1) } : u);
        this.toast.success('Conexión eliminada');
      },
      error: () => {
        this.connectionLoading.set(false);
        this.toast.error('Error al eliminar conexión');
      },
    });
  }

  rejectRequest(): void {
    const requestId = this.connectionStatus().requestId;
    if (!requestId) return;

    const currentUserId = localStorage.getItem('userId');
    this.connectionLoading.set(true);
    this.connectionService.rejectConnection(requestId, currentUserId ?? undefined).subscribe({
      next: () => {
        this.connectionStatus.set({ status: 'NONE' });
        this.connectionLoading.set(false);
        this.toast.success('Solicitud rechazada');
      },
      error: () => {
        this.connectionLoading.set(false);
        this.toast.error('Error al rechazar solicitud');
      },
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
          this.toast.success('Usuario desbloqueado');
        },
        error: () => {
          this.blockLoading.set(false);
          this.toast.error('Error al desbloquear');
        },
      });
    } else {
      this.blockService.block(currentUserId, targetUserId).subscribe({
        next: () => {
          this.isBlocked.set(true);
          this.blockLoading.set(false);
          this.toast.success('Usuario bloqueado');
          if (this.connectionStatus().status === 'CONNECTED') {
            const connectionId = this.connectionStatus().connectionId;
            if (connectionId) {
              this.connectionService.removeConnection(connectionId).subscribe(() => {
                this.connectionStatus.set({ status: 'NONE' });
              });
            }
          }
        },
        error: () => {
          this.blockLoading.set(false);
          this.toast.error('Error al bloquear');
        },
      });
    }
  }

  goBack(): void {
    // history.back() si hay una ruta anterior dentro de la app;
    // si la URL se abrió directamente, cae al inicio.
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  /** Abre el chat con esa persona; si no me sigue, su mensaje cae en solicitudes. */
  escribirMensaje(): void {
    const targetUserId = this.user()?.id;
    if (!targetUserId || this.isBlocked()) return;

    const role = (localStorage.getItem('role') || '').toLowerCase();
    const base = role === 'desarrollador' || role === 'developer' ? '/developer' : '/recruiter';
    this.router.navigate([`${base}/messages`], { queryParams: { user: targetUserId } });
  }

  getInitials(): string {
    const name = this.user()?.nombre || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
