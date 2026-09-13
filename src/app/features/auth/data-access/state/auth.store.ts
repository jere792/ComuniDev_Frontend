import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_REPOSITORY, AuthRepository, LoginRequest, RegisterRequest, LoginResponse } from '../../domain/ports/auth.repository';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private repository = inject<AuthRepository>(AUTH_REPOSITORY);
  private router = inject(Router);

  readonly user = signal<LoginResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isAuthenticated = computed(() => !!localStorage.getItem('token'));
  readonly role = signal<string | null>(localStorage.getItem('role'));

  login(request: LoginRequest): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.login(request).subscribe({
      next: (data: LoginResponse) => {
        this.setSession(data);
        this.loading.set(false);
        this.navigateByRole(data.rolActivo);
      },
      error: (err: unknown) => {
        this.error.set('Credenciales incorrectas');
        this.loading.set(false);
      },
    });
  }

  register(request: RegisterRequest): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.register(request).subscribe({
      next: (_data: LoginResponse) => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err: unknown) => {
        this.error.set('Error al registrar');
        this.loading.set(false);
      },
    });
  }

  completeRole(userId: string, rol: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.completeRole(userId, rol).subscribe({
      next: (data: LoginResponse) => {
        this.setSession(data);
        this.loading.set(false);
        this.navigateByRole(rol);
      },
      error: (err: unknown) => {
        this.error.set('Error al asignar rol');
        this.loading.set(false);
      },
    });
  }

  handleOAuthCallback(params: Record<string, string>): void {
    const token = params['token'];
    const role = params['role'];
    const needsRole = params['needsRole'] === 'true';
    const userId = params['id'];
    const nombre = params['nombre'];
    const email = params['email'];

    if (needsRole && userId && token) {
      this.router.navigate(['/auth/role-selection'], {
        queryParams: { userId, token, nombre, email },
      });
      return;
    }

    if (token && role) {
      const normalizedRole = role.toLowerCase();
      localStorage.removeItem('userPhoto');
      localStorage.removeItem('userEmail');
      localStorage.setItem('token', token);
      localStorage.setItem('role', normalizedRole);
      if (userId) localStorage.setItem('userId', userId);
      if (nombre) localStorage.setItem('userName', nombre);
      if (email) localStorage.setItem('userEmail', email);
      this.role.set(normalizedRole);
      this.navigateByRole(role);
    } else {
      this.router.navigate(['/']);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userUsername');
    localStorage.removeItem('userPhoto');
    this.user.set(null);
    this.role.set(null);
    this.router.navigate(['/']);
  }

  private setSession(data: LoginResponse): void {
    localStorage.removeItem('userPhoto');
    localStorage.removeItem('userEmail');
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.rolActivo.toLowerCase());
    localStorage.setItem('userId', data.id);
    localStorage.setItem('userName', data.nombre || data.nombreUsuario);
    localStorage.setItem('userUsername', data.nombreUsuario);
    localStorage.setItem('userEmail', data.email);
    this.user.set(data);
    this.role.set(data.rolActivo.toLowerCase());
  }

  private navigateByRole(role: string): void {
    switch (role.toLowerCase()) {
      case 'admin': this.router.navigate(['/admin']); break;
      case 'moderator': this.router.navigate(['/moderator']); break;
      case 'recruiter': this.router.navigate(['/recruiter']); break;
      default: this.router.navigate(['/developer']); break;
    }
  }
}
