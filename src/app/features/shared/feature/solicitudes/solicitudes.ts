import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ConnectionStore } from '@features/shared/data-access/state/connection.store';
import { ConnectionRequest } from '@features/shared/domain/models/connection.model';
import { UserStore } from '@features/users/data-access/state/user.store';
import { User } from '@core/domain/models/user.model';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';

interface RequestWithUser extends ConnectionRequest {
  solicitante?: User;
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, ConfirmModal],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.scss',
})
export class Solicitudes implements OnInit {
  pendingRequests = signal<RequestWithUser[]>([]);
  sentRequests = signal<RequestWithUser[]>([]);
  connections = signal<any[]>([]);
  usersMap = signal<Map<string, User>>(new Map());
  loading = signal(true);
  activeTab = signal<'recibidas' | 'enviadas' | 'conexiones'>('recibidas');
  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmMessage = signal('');
  confirmAction = signal<'remove' | 'cancel' | null>(null);
  pendingId = signal<string | null>(null);

  private connService = inject(ConnectionStore);
  private userStore = inject(UserStore);
  private router = inject(Router);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadData();

    const userId = localStorage.getItem('userId');
    if (userId) {
      this.connService
        .subscribeToConnectionStatus(userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.loadData());
    }
  }

  private loadData(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.connService.getConnectionRequests(userId).subscribe({
      next: (requests) => {
        const received = requests.filter(r => r.receptorId === userId && r.estado === 'PENDIENTE');
        const sent = requests.filter(r => r.solicitanteId === userId && r.estado === 'PENDIENTE');
        this.pendingRequests.set(received);
        this.sentRequests.set(sent);

        const allUserIds = [...new Set([
          ...received.map(r => r.solicitanteId),
          ...sent.map(r => r.receptorId),
        ])];
        this.loadUsers(allUserIds);
      },
    });

    this.connService.getConnections(userId).subscribe({
      next: (connections) => {
        this.connections.set(connections);
        const peerIds = connections.map(c =>
          c.usuarioMenorId === userId ? c.usuarioMayorId : c.usuarioMenorId
        );
        this.loadUsers(peerIds);
      },
    });
  }

  private loadUsers(_userIds: string[]): void {
    this.userStore.getAll().subscribe({
      next: (users: User[]) => {
        const map = new Map<string, User>();
        users.forEach(u => { if (u.id) map.set(u.id, u); });
        this.usersMap.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getUser(id: string): User | undefined {
    return this.usersMap().get(id);
  }

  acceptRequest(requestId: string): void {
    this.connService.acceptConnection(requestId).subscribe({
      next: () => {
        this.pendingRequests.update(reqs => reqs.filter(r => r.id !== requestId));
        this.toast.success('Solicitud aceptada');
      },
      error: () => this.toast.error('Error al aceptar solicitud'),
    });
  }

  rejectRequest(requestId: string): void {
    const userId = localStorage.getItem('userId');
    this.connService.rejectConnection(requestId, userId ?? undefined).subscribe({
      next: () => {
        this.pendingRequests.update(reqs => reqs.filter(r => r.id !== requestId));
        this.toast.success('Solicitud rechazada');
      },
      error: () => this.toast.error('Error al rechazar solicitud'),
    });
  }

  askCancelRequest(requestId: string): void {
    this.pendingId.set(requestId);
    this.confirmAction.set('cancel');
    this.confirmTitle.set('Cancelar solicitud');
    this.confirmMessage.set('¿Estás seguro de cancelar esta solicitud de conexión?');
    this.confirmOpen.set(true);
  }

  askRemoveConnection(connectionId: string): void {
    this.pendingId.set(connectionId);
    this.confirmAction.set('remove');
    this.confirmTitle.set('Eliminar conexión');
    this.confirmMessage.set('¿Estás seguro de eliminar esta conexión?');
    this.confirmOpen.set(true);
  }

  onConfirm(): void {
    const action = this.confirmAction();
    const id = this.pendingId();
    this.confirmOpen.set(false);
    this.confirmAction.set(null);
    this.pendingId.set(null);
    if (!id) return;

    if (action === 'cancel') {
      const userId = localStorage.getItem('userId');
      this.connService.rejectConnection(id, userId ?? undefined).subscribe({
        next: () => {
          this.sentRequests.update(reqs => reqs.filter(r => r.id !== id));
          this.toast.success('Solicitud cancelada');
        },
        error: () => this.toast.error('Error al cancelar solicitud'),
      });
    } else if (action === 'remove') {
      this.connService.removeConnection(id).subscribe({
        next: () => {
          this.connections.update(conns => conns.filter(c => c.id !== id));
          this.toast.success('Conexión eliminada');
        },
        error: () => this.toast.error('Error al eliminar conexión'),
      });
    }
  }

  onCancelConfirm(): void {
    this.confirmOpen.set(false);
    this.confirmAction.set(null);
    this.pendingId.set(null);
  }

  setTab(tab: 'recibidas' | 'enviadas' | 'conexiones'): void {
    this.activeTab.set(tab);
  }

  goToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  goBack(): void {
    this.router.navigate([this.getBaseRoute()]);
  }

  private getBaseRoute(): string {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (role === 'reclutador' || role === 'recruiter') return '/recruiter/inicio';
    if (role === 'desarrollador' || role === 'developer') return '/developer/inicio';
    return '/';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getPeerId(conn: any): string {
    const userId = localStorage.getItem('userId');
    return conn.usuarioMenorId === userId ? conn.usuarioMayorId : conn.usuarioMenorId;
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }
}
