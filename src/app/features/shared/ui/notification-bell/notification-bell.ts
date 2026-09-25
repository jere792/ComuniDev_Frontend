import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NOTIFICATION_REPOSITORY, NotificationRepository } from '@features/shared/domain/ports/notification.repository';
import { AppNotification } from '@features/shared/domain/models/app-notification.model';
import { ConnectionStore } from '@features/shared/data-access/state/connection.store';
import { ConnectionRequest } from '@features/shared/domain/models/connection.model';

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
  unreadCount = signal(0);
  isOpen = signal(false);

  private notifService = inject<NotificationRepository>(NOTIFICATION_REPOSITORY);
  private connService = inject(ConnectionStore);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.loadNotifications(userId);
      this.loadConnectionRequests(userId);
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
        });
    }
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
      next: (reqs) => this.connectionRequests.set(reqs),
    });
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
      case 'COMENTARIO': return 'comment';
      case 'REACCION': return 'favorite';
      default: return 'notifications';
    }
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
