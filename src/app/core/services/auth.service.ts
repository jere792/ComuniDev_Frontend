import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, LoginData } from '@core/services/api.service';
import { TokenRefreshService } from '@core/services/token-refresh.service';
import { TERMINOS_VERSION } from '@shared/constants/terminos';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private api = inject(ApiService);
  private session = inject(TokenRefreshService);


  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  login(email: string, password: string): Promise<LoginData> {
    return new Promise((resolve, reject) => {
      this.api.login({ email, password }).subscribe({
        next: (data) => {
          localStorage.removeItem('userPhoto');
          localStorage.removeItem('userEmail');
          // access JWT (15 min) + refresh JWT (7 días) para renovar la sesión
          this.session.saveTokens(data.token, data.refreshToken);
          if (data.rolActivo) {
            localStorage.setItem('role', data.rolActivo.toLowerCase());
          } else {
            // cuenta OAuth que todavía no eligió rol (needsRole): falta completar la selección
            localStorage.removeItem('role');
          }
          localStorage.setItem('userId', data.id);
          localStorage.setItem('userName', data.nombre || data.nombreUsuario);
          localStorage.setItem('userUsername', data.nombreUsuario);
          resolve(data);
        },
        error: (err) => reject(err),
      });
    });
  }

  register(nombre: string, nombreUsuario: string, email: string, password: string, rol: string, telefono?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.api.register({
        nombre,
        nombreUsuario,
        email,
        password,
        rol,
        telefono,
        //prueba de aceptación de términos: versión y fecha quedan en el usuario
        terminosVersion: TERMINOS_VERSION,
        terminosAceptadosEn: new Date().toISOString(),
      }).subscribe({
        next: (data) => resolve(data),
        error: (err) => reject(err),
      });
    });
  }

  navigateByRole(role: string | null): void {
    if (!role) {
      // cuenta OAuth que todavía no eligió rol (needsRole): completar la selección
      this.router.navigate(['/auth/role-selection']);
      return;
    }
    switch (role.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'moderator':
        this.router.navigate(['/moderator']);
        break;
      case 'recruiter':
        this.router.navigate(['/recruiter']);
        break;
      case 'developer':
      default:
        this.router.navigate(['/developer']);
        break;
    }
  }

  logout(): void {
    // best-effort: el backend no invalida tokens, solo borra del lado cliente
    this.session.logoutRemote();
    this.session.clearSession();
    this.router.navigate(['/']);
  }
}
