import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  BanUserRequest,
  UnbanUserRequest,
  UserBanInfo,
  UserModerationRepository,
} from '@features/users/domain/ports/user-moderation.repository';

/** Envoltorio estándar del backend: `{ success, message, data }`. */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Suspensiones de cuentas por REST (`/api/v1/admin/users/{id}/ban|unban`),
 * mismo patrón de URL que `core/services/report.service.ts`.
 *
 * El GraphQL `User` no expone `baneo`, así que el estado real de la fila se
 * mantiene en la señal local del `UserStore` (ver `UserStore.baneados`).
 */
@Injectable({ providedIn: 'root' })
export class UserModerationHttpService implements UserModerationRepository {
  private http = inject(HttpClient);

  private readonly API = `${environment.apiUrl}/admin/users`;

  ban(userId: string, request: BanUserRequest): Observable<UserBanInfo | null> {
    return this.http
      .post<ApiResponse<UserBanInfo>>(`${this.API}/${userId}/ban`, {
        moderadorId: request.moderadorId,
        tipo: request.tipo,
        razon: request.razon,
        duracionDias: request.tipo === 'TEMPORAL' ? request.duracionDias : null,
      })
      .pipe(map((res) => res?.data ?? null));
  }

  unban(userId: string, request: UnbanUserRequest): Observable<UserBanInfo | null> {
    return this.http
      .post<ApiResponse<UserBanInfo>>(`${this.API}/${userId}/unban`, {
        moderadorId: request.moderadorId,
      })
      .pipe(map((res) => res?.data ?? null));
  }
}
