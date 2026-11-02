import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { TokenRefreshService } from '@core/services/token-refresh.service';

/**
 * Endpoints donde un 401 es esperado y NO debe disparar un refresh:
 * credenciales mal, refresh token inválido o logout con token ya vencido.
 */
const AUTH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Adjunta el access token y, si el backend responde 401, renueva la sesión
 * (una sola vez) y reintenta la petición original con el token nuevo.
 *
 * <p>Sin bucles: el reintento se devuelve como observable nuevo que NO vuelve
 * a pasar por este `catchError`; si el refresh falla se propaga el 401 original
 * (quien refresca ya hizo logoutLocal con toast).</p>
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(TokenRefreshService);
  const token = session.accessToken;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || isAuthUrl(req.url)) {
        return throwError(() => err);
      }

      // Otro flujo ya rotó la sesión mientras esta petición volvía:
      // se reintenta con el token actual sin rotar de nuevo.
      const actual = session.accessToken;
      if (actual && actual !== token) {
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${actual}` } }));
      }

      // Un solo reintento por petición (single-flight compartido con GraphQL).
      return from(session.refresh()).pipe(
        switchMap((newToken) => {
          if (!newToken) return throwError(() => err);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        }),
      );
    }),
  );
};

function isAuthUrl(url: string): boolean {
  return AUTH_URLS.some((path) => url.includes(path));
}
