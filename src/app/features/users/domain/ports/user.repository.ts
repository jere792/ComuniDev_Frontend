import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../../core/domain/models/user.model';

export interface UserRepository {
  getAll(): Observable<User[]>;
  getById(id: string): Observable<User | null>;
  update(id: string, data: Partial<User>): Observable<User>;
  delete(id: string): Observable<boolean>;
}

export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
