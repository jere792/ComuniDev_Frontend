import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  nombreUsuario: string;
  email: string;
  password: string;
  rol: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginData {
  id: string;
  nombre: string;
  nombreUsuario: string;
  email: string;
  roles: string[];
  rolActivo: string;
  estadoCuenta: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginData> {
    return this.http
      .post<ApiResponse<LoginData>>(`${this.baseUrl}/auth/login`, payload)
      .pipe(map(res => res.data));
  }

  register(payload: RegisterPayload): Observable<any> {
    return this.http
      .post<ApiResponse<any>>(`${this.baseUrl}/users`, payload)
      .pipe(map(res => res.data));
  }

  completeRole(userId: string, rol: string): Observable<LoginData> {
    return this.http
      .post<ApiResponse<LoginData>>(`${this.baseUrl}/auth/complete-role`, { userId, rol })
      .pipe(map(res => res.data));
  }
}
