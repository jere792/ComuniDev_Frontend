import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NOTIFICATION_REPOSITORY, NotificationRepository } from '@features/shared/domain/ports/notification.repository';
import { AppNotification } from '@features/shared/domain/models/app-notification.model';
import { ConnectionStore } from '@features/shared/data-access/state/connection.store';
import { ConnectionRequest } from '@features/shared/domain/models/connection.model';
import { FollowStore } from '@features/shared/data-access/state/follow.store';
import { FollowRequest } from '@features/shared/domain/ports/follow.repository';
import { UserStore } from '@features/users/data-access/state/user.store';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell implements OnInit {
  notifications = signal<AppNotification[]>([]);
  connectionRequests = signal<ConnectionRequest[]>([]);
  /** Solicitudes de seguir de perfiles privados (estilo Instagram). */
  solicitudesSeguir = signal<FollowRequest[]>([]);
  unreadCount = signal(0);
  isOpen = signal(false);
  /** Nombre y foto de quien pide conexion, resueltos en lote. */
  solicitantes = signal<Map<string, { nombre: string; foto: string }>>(new Map());

  private notifService = inject<NotificationRepository>(NOTIFICATION_REPOSITORY);
  private connService = inject(ConnectionStore);
  private followService = inject(FollowStore);
  private userStore = inject(UserStore);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.loadNotifications(userId);
      this.loadConnectionRequests(userId);
      this.loadFollowRequests(userId);
      this.notifService
        .subscribeToNotifications(userId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((notif) => {
          this.notifications.update((list) => [notif, ...list.filter((n) => n.id !== notif.id)]);
          if (!notif.leida) {
            this.unreadCount.update((c) => c + 1);
          }
          if (notif.tipo === 'SOLICITUD_CONEXION') {
            this.loadConnectionRequests(userId);
          }
          if (notif.tipo === 'SOLICITUD_SEGUIR') {
            this.loadFollowRequests(userId);
          }
        });
    }
  }

  /** Solicitudes de seguir pendientes (perfil privado), con sus autores en lote. */
  private loadFollowRequests(userId: string): void {
    this.followService.getFollowRequests(userId).subscribe({
      next: (solicitudes) => {
        this.solicitudesSeguir.set(solicitudes);
        this.cargarSolicitantes(solicitudes.map(s => s.seguidorId));
      },
    });
  }

  aceptarSeguimiento(requestId: string): void {
    this.followService.acceptFollowRequest(requestId).subscribe({
      next: () => this.solicitudesSeguir.update(lista => lista.filter(s => s.id !== requestId)),
    });
  }

  rechazarSeguimiento(requestId: string): void {
    this.followService.rejectFollowRequest(requestId).subscribe({
      next: () => this.solicitudesSeguir.update(lista => lista.filter(s => s.id !== requestId)),
    });
  }

  private loadNotifications(userId: string): void {
    this.notifService.getNotifications(userId).subscribe({
      next: (notifs) => {
        this.notifications.set(notifs);
        this.unreadCount.set(notifs.filter(n => !n.leida).length);
      },
    });
  }

  private loadConnectionRequests(userId: string): void {
    this.connService.getConnectionRequests(userId).subscribe({
      next: (reqs) => {
        this.connectionRequests.set(reqs);
        this.cargarSolicitantes(reqs.map(r => r.solicitanteId));
      },
    });
  }

  /** Nombre y foto de quien pide conexion en UNA sola peticion (aliases). */
  private cargarSolicitantes(ids: string[]): void {
    const faltantes = [...new Set(ids)].filter(id => id && !this.solicitantes().has(id));
    if (faltantes.length === 0) return;

    this.userStore.getByIds(faltantes).subscribe({
      next: (usuarios: any[]) => {
        this.solicitantes.update(mapa => {
          const nuevo = new Map(mapa);
          usuarios.forEach(u => {
            if (u?.id) nuevo.set(u.id, { nombre: u.nombre || 'Alguien', foto: u.fotoPerfilUrl || '' });
          });
          return nuevo;
        });
      },
      error: () => {},
    });
  }

  nombreDeSolicitante(solicitanteId: string): string | null {
    return this.solicitantes().get(solicitanteId)?.nombre ?? null;
  }

  fotoDeSolicitante(solicitanteId: string): string | null {
    return this.solicitantes().get(solicitanteId)?.foto || null;
  }

  iniciales(nombre: string): string {
    return nombre.split(/\s+/).map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  /** Emoji del tipo de reaccion que trae la notificacion. */
  emojiDe(notif: AppNotification): string {
    switch (notif.detalle) {
      case 'LIKE': return '👍';
      case 'LOVE': return '❤️';
      case 'CELEBRATE': return '🎉';
      case 'SUPPORT': return '🤝';
      default: return '';
    }
  }

  togglePanel(): void {
    this.isOpen.update(v => !v);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  markAsRead(notificationId: string): void {
    this.notifService.markAsRead(notificationId).subscribe({
      next: () => {
        this.notifications.update(notifs =>
          notifs.map(n => n.id === notificationId ? { ...n, leida: true } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      },
    });
  }

  markAllAsRead(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.notifService.markAllAsRead(userId).subscribe({
      next: () => {
        this.notifications.update(notifs =>
          notifs.map(n => ({ ...n, leida: true }))
        );
        this.unreadCount.set(0);
      },
    });
  }

  acceptRequest(requestId: string): void {
    this.connService.acceptConnection(requestId).subscribe({
      next: () => {
        this.connectionRequests.update(reqs => reqs.filter(r => r.id !== requestId));
      },
    });
  }

  rejectRequest(requestId: string): void {
    const userId = localStorage.getItem('userId');
    this.connService.rejectConnection(requestId, userId ?? undefined).subscribe({
      next: () => {
        this.connectionRequests.update(reqs => reqs.filter(r => r.id !== requestId));
      },
    });
  }

  getNotificationIcon(tipo: string): string {
    switch (tipo) {
      case 'SOLICITUD_CONEXION': return 'person_add';
      case 'CONEXION_ACEPTADA': return 'check_circle';
      case 'SOLICITUD_RECHAZADA': return 'person_cancel';
      case 'SOLICITUD_SEGUIR': return 'group_add';
      case 'SEGUIMIENTO_ACEPTADO': return 'check_circle';
      case 'SEGUIMIENTO_RECHAZADO': return 'person_cancel';
      case 'COMENTARIO': return 'comment';
      case 'REACCION': return 'favorite';
      default: return 'notifications';
    }
  }

  getTimeAgo(dateStr?: string): string {
    if (!dateStr) return '';
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
