import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  nombreUsuario: string;
  email: string;
  password: string;
  rol: string;
  telefono?: string;
}

export interface LoginResponse {
  id: string;
  nombre: string;
  nombreUsuario: string;
  email: string;
  roles: string[];
  rolActivo: string;
  estadoCuenta: string;
  token: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: LoginResponse | null;
  token: string | null;
  role: string | null;
}

export abstract class AuthRepository {
  abstract login(request: LoginRequest): Observable<LoginResponse>;
  abstract register(request: RegisterRequest): Observable<LoginResponse>;
  abstract completeRole(userId: string, rol: string): Observable<LoginResponse>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AuthRepository');
