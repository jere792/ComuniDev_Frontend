import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConnectionGraphqlService, ConnectionRequest } from '../../../../core/services/social/connection-graphql.service';
import { GraphQLService, User } from '../../../../core/services/graphql.service';

interface RequestWithUser extends ConnectionRequest {
  solicitante?: User;
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule],
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

  private connService = inject(ConnectionGraphqlService);
  private graphql = inject(GraphQLService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadData();
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

  private loadUsers(userIds: string[]): void {
    this.graphql.getUsers().subscribe({
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
      },
    });
  }

  rejectRequest(requestId: string): void {
    this.connService.rejectConnection(requestId).subscribe({
      next: () => {
        this.pendingRequests.update(reqs => reqs.filter(r => r.id !== requestId));
      },
    });
  }

  cancelRequest(requestId: string): void {
    this.connService.rejectConnection(requestId).subscribe({
      next: () => {
        this.sentRequests.update(reqs => reqs.filter(r => r.id !== requestId));
      },
    });
  }

  removeConnection(connectionId: string): void {
    this.connService.removeConnection(connectionId).subscribe({
      next: () => {
        this.connections.update(conns => conns.filter(c => c.id !== connectionId));
      },
    });
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
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    if (role === 'RECLUTADOR') return '/recruiter/inicio';
    if (role === 'DESARROLLADOR') return '/developer/dashboard';
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
