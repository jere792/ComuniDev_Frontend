import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@core/domain/models/user.model';

export interface NotificationPreferences {
  email?: boolean;
  push?: boolean;
  mensajes?: boolean;
  comentarios?: boolean;
  reacciones?: boolean;
  conexiones?: boolean;
  vacantes?: boolean;
}

export interface UploadResponse {
  url: string;
}

export interface UserRepository {
  /** Con size se pide una pagina; sin args el backend devuelve la lista completa. */
  getAll(page?: number, size?: number): Observable<User[]>;
  /** Varias personas en una sola consulta (aliases), para no pedir autor por autor. */
  getByIds(ids: string[]): Observable<User[]>;
  getById(id: string): Observable<User | null>;
  update(id: string, data: Partial<User>): Observable<User>;
  delete(id: string): Observable<boolean>;
  uploadFile(file: File): Observable<UploadResponse>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<boolean>;
  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Observable<unknown>;
}

export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
