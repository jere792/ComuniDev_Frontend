import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '@core/domain/models/user.model';
import {
  NotificationPreferences,
  UploadResponse,
  USER_REPOSITORY,
  UserRepository,
} from '@features/users/domain/ports/user.repository';
import {
  BanUserRequest,
  USER_MODERATION_REPOSITORY,
  UserBanInfo,
  UserModerationRepository,
  UnbanUserRequest,
} from '@features/users/domain/ports/user-moderation.repository';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private repository = inject<UserRepository>(USER_REPOSITORY);
  private moderation = inject<UserModerationRepository>(USER_MODERATION_REPOSITORY);

  readonly users = signal<User[]>([]);
  readonly selectedUser = signal<User | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalCount = computed(() => this.users().length);

  /**
   * Ids suspendidos en esta sesión. El GraphQL `User` no expone `baneo`, así
   * que el badge "Suspendido" vive en estado local: se marca al banear y se
   * limpia al desbanear (no sobrevive a un refresco de página).
   */
  readonly baneados = signal<string[]>([]);

  getAll(): Observable<User[]> {
    return this.repository.getAll();
  }

  /** Página de usuarios (más recientes primero); la usa Discover. */
  getPagina(page: number, size: number): Observable<User[]> {
    return this.repository.getAll(page, size);
  }

  getById(id: string): Observable<User | null> {
    return this.repository.getById(id);
  }

  /** Varias personas en una sola peticion (aliases), p. ej. autores del feed de reels. */
  getByIds(ids: string[]): Observable<User[]> {
    return this.repository.getByIds(ids);
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

  /** ¿Tiene suspension activa en esta sesión? (ver `baneados`) */
  estaBaneado(userId: string): boolean {
    return this.baneados().includes(userId);
  }

  /** Suspende la cuenta y marca la fila como "Suspendido". */
  ban(userId: string, request: BanUserRequest): Observable<UserBanInfo | null> {
    return this.moderation.ban(userId, request).pipe(
      tap((info) => {
        if (info?.baneado) {
          this.baneados.update((ids) => (ids.includes(userId) ? ids : [...ids, userId]));
        }
      }),
    );
  }

  /** Levanta la suspension y quita el badge de la fila. */
  unban(userId: string, request: UnbanUserRequest): Observable<UserBanInfo | null> {
    return this.moderation.unban(userId, request).pipe(
      tap(() => {
        this.baneados.update((ids) => ids.filter((id) => id !== userId));
      }),
    );
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
