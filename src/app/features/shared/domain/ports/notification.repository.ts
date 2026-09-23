import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AppNotification } from '@features/shared/domain/models/app-notification.model';

export interface NotificationRepository {
  getNotifications(userId: string, leida?: boolean): Observable<AppNotification[]>;
  getUnreadCount(userId: string): Observable<number>;
  markAsRead(notificationId: string): Observable<boolean>;
  markAllAsRead(userId: string): Observable<boolean>;
  deleteNotification(notificationId: string): Observable<boolean>;
}

export const NOTIFICATION_REPOSITORY = new InjectionToken<NotificationRepository>('NotificationRepository');
