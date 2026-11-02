import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

/** `PERMANENTE` (sin fecha de fin) o `TEMPORAL` (con `duracionDias`). */
export type TipoBan = 'PERMANENTE' | 'TEMPORAL';

export interface BanUserRequest {
  /** Admin/moderador en sesión (lo manda el cliente hasta que haya JWT). */
  moderadorId: string | null;
  tipo: TipoBan;
  /** Motivo que verá el usuario; el backend lo exige. */
  razon: string;
  /** Solo `TEMPORAL`; el backend valida que sea mayor a cero. */
  duracionDias: number | null;
}

export interface UnbanUserRequest {
  moderadorId: string | null;
}

/** Estado de suspensión que devuelve `POST /admin/users/{id}/ban|unban`. */
export interface UserBanInfo {
  userId: string;
  baneado: boolean;
  tipo: string | null;
  razon: string | null;
  fechaInicio: string | null;
  /** null = ban permanente. */
  fechaFin: string | null;
  moderadorId: string | null;
}

export interface UserModerationRepository {
  ban(userId: string, request: BanUserRequest): Observable<UserBanInfo | null>;
  unban(userId: string, request: UnbanUserRequest): Observable<UserBanInfo | null>;
}

export const USER_MODERATION_REPOSITORY = new InjectionToken<UserModerationRepository>(
  'UserModerationRepository',
);
