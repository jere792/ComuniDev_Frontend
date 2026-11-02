import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, of, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from '@core/services/toast.service';

/** Access token JWT (15 min). */
export const TOKEN_KEY = 'token';
/** Refresh token JWT (7 días), rota en cada refresh. */
export const REFRESH_TOKEN_KEY = 'refresh_token';

interface RefreshApiResponse {
  success: boolean;
  message?: string;
  data?: { token: string; refreshToken: string };
}

/** Claves de sesión que se borran juntas al cerrar/expirar. */
const SESSION_KEYS = [
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  'role',
  'userId',
  'userName',
  'userUsername',
  'userPhoto',
  'userEmail',
];

/**
 * Sesión JWT de la web: access token corto + refresh token.
 *
 * <p>El access token expira a los 15 minutos, así que todo 401 con sesión
 * activa pasa por {@link refresh}, que es <b>single-flight</b>: si llegan
 * varios 401 a la vez solo se hace UNA llamada a {@code POST /auth/refresh}
 * y todos esperan el mismo par nuevo (así no se rotan tokens en paralelo).</p>
 *
 * <p>Si el refresh falla (refresh token viejo/`token-temporal-*`, expirado o
 * sin conexión) se hace {@link logoutLocal}: borrar sesión + toast + volver
 * al inicio.</p>
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  /** Refresh en curso (single-flight): todas las llamadas comparten la misma promesa. */
  private pending: Promise<string | null> | null = null;

  get accessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /** Guarda el par que devuelven login, complete-role y el callback OAuth. */
  saveTokens(token: string, refreshToken?: string | null): void {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Rota la sesión y devuelve el access token nuevo, o null si ya no hay
   * sesión (en ese caso ya se hizo logoutLocal).
   */
  refresh(): Promise<string | null> {
    if (!this.pending) {
      this.pending = this.rotate().finally(() => {
        this.pending = null;
      });
    }
    return this.pending;
  }

  private async rotate(): Promise<string | null> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      // Sesión vieja sin refresh (p. ej. token-temporal-*): no hay como renovarla
      this.logoutLocal();
      return null;
    }

    try {
      const res = await firstValueFrom(
        this.http.post<RefreshApiResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }),
      );
      const token = res?.data?.token;
      if (res?.success && token) {
        this.saveTokens(token, res.data?.refreshToken);
        return token;
      }
      this.logoutLocal();
      return null;
    } catch {
      // Refresh inválido o expirado (o el servidor no responde): la sesión no se puede renovar
      this.logoutLocal();
      return null;
    }
  }

  /**
   * `POST /auth/logout` best-effort (fire-and-forget): el backend no invalida
   * nada server-side, solo avisa. Se lanza ANTES de borrar los tokens locales
   * para que viaje el Authorization actual.
   */
  logoutRemote(): void {
    const token = this.accessToken;
    if (!token && !this.refreshToken) return; // no hay sesión que avisar
    this.http
      .post(
        `${environment.apiUrl}/auth/logout`,
        {},
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      )
      .pipe(take(1), catchError(() => of(null)))
      .subscribe({ error: () => undefined });
  }

  /** Borra la sesión completa (tokens + datos de usuario) sin navegar. */
  clearSession(): void {
    for (const key of SESSION_KEYS) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Logout limpio cuando un 401 no se pudo renovar: borra la sesión, avisa
   * con toast y vuelve al inicio. Idempotente: si ya no hay sesión no repite
   * toast ni navegación (varios 401 simultáneos generan un solo aviso).
   */
  logoutLocal(): void {
    const hadSession = !!(this.accessToken || this.refreshToken);
    this.clearSession();
    if (!hadSession) return;
    this.toast.warning('Tu sesión expiró, vuelve a iniciar sesión');
    this.router.navigate(['/']);
  }
}
