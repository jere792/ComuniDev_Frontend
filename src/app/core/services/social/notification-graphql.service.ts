import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

export interface NotificationReferencia {
  tipo?: string;
  id?: string;
}

export interface AppNotification {
  id: string;
  destinatarioId: string;
  actorId?: string;
  tipo: string;
  titulo: string;
  mensaje?: string;
  referencia?: NotificationReferencia;
  leida: boolean;
  createdAt: string;
}

const GET_NOTIFICATIONS = gql`
  query Notifications($userId: String!, $leida: Boolean) {
    notifications(userId: $userId, leida: $leida) {
      id
      destinatarioId
      actorId
      tipo
      titulo
      mensaje
      referencia { tipo id }
      leida
      createdAt
    }
  }
`;

const GET_UNREAD_COUNT = gql`
  query UnreadCount($userId: String!) {
    unreadCount(userId: $userId)
  }
`;

const MARK_AS_READ = gql`
  mutation MarkNotificationAsRead($notificationId: String!) {
    markNotificationAsRead(notificationId: $notificationId)
  }
`;

const MARK_ALL_AS_READ = gql`
  mutation MarkAllAsRead($userId: String!) {
    markAllAsRead(userId: $userId)
  }
`;

const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($notificationId: String!) {
    deleteNotification(notificationId: $notificationId)
  }
`;

@Injectable({ providedIn: 'root' })
export class NotificationGraphqlService {
  private apollo = inject(Apollo);

  getNotifications(userId: string, leida?: boolean): Observable<AppNotification[]> {
    return this.apollo
      .watchQuery<any>({
        query: GET_NOTIFICATIONS,
        variables: { userId, leida },
        pollInterval: 30000,
      })
      .valueChanges.pipe(map((r) => r.data?.notifications ?? []));
  }

  getUnreadCount(userId: string): Observable<number> {
    return this.apollo
      .watchQuery<{ unreadCount: number }>({
        query: GET_UNREAD_COUNT,
        variables: { userId },
        pollInterval: 30000,
      })
      .valueChanges.pipe(map((r) => r.data?.unreadCount ?? 0));
  }

  markAsRead(notificationId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ markNotificationAsRead: boolean }>({
        mutation: MARK_AS_READ,
        variables: { notificationId },
      })
      .pipe(map((r) => r.data?.markNotificationAsRead ?? false));
  }

  markAllAsRead(userId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ markAllAsRead: boolean }>({
        mutation: MARK_ALL_AS_READ,
        variables: { userId },
      })
      .pipe(map((r) => r.data?.markAllAsRead ?? false));
  }

  deleteNotification(notificationId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteNotification: boolean }>({
        mutation: DELETE_NOTIFICATION,
        variables: { notificationId },
      })
      .pipe(map((r) => r.data?.deleteNotification ?? false));
  }
}
