import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@core/domain/models/user.model';
import {
  NotificationPreferences,
  UploadResponse,
  USER_REPOSITORY,
  UserRepository,
} from '@features/users/domain/ports/user.repository';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private repository = inject<UserRepository>(USER_REPOSITORY);

  readonly users = signal<User[]>([]);
  readonly selectedUser = signal<User | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalCount = computed(() => this.users().length);

  getAll(): Observable<User[]> {
    return this.repository.getAll();
  }

  getById(id: string): Observable<User | null> {
    return this.repository.getById(id);
  }

  update(id: string, data: Partial<User>): Observable<User> {
    return this.repository.update(id, data);
  }

  delete(id: string): Observable<boolean> {
    return this.repository.delete(id);
  }

  uploadFile(file: File): Observable<UploadResponse> {
    return this.repository.uploadFile(file);
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<boolean> {
    return this.repository.changePassword(userId, currentPassword, newPassword);
  }

  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Observable<unknown> {
    return this.repository.updateNotificationPreferences(userId, preferences);
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getAll().subscribe({
      next: (users: User[]) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar usuarios');
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.users.set([]);
    this.selectedUser.set(null);
    this.error.set(null);
  }
}
