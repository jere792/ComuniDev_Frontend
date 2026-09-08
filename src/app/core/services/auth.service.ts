import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, LoginData } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private router: Router, private api: ApiService) {}

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
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.rolActivo.toLowerCase());
          localStorage.setItem('userId', data.id);
          resolve(data);
        },
        error: (err) => reject(err),
      });
    });
  }

  register(nombre: string, nombreUsuario: string, email: string, password: string, rol: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.api.register({ nombre, nombreUsuario, email, password, rol }).subscribe({
        next: (data) => resolve(data),
        error: (err) => reject(err),
      });
    });
  }

  navigateByRole(role: string): void {
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
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    this.router.navigate(['/']);
  }
}
