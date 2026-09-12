import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { AuthRepository, LoginRequest, RegisterRequest, LoginResponse } from '../../domain/ports/auth.repository';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthHttpService implements AuthRepository {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/login`, request)
      .pipe(map(res => res.data));
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/users`, request)
      .pipe(map(res => res.data));
  }

  completeRole(userId: string, rol: string): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.baseUrl}/auth/complete-role`, { userId, rol })
      .pipe(map(res => res.data));
  }
}
