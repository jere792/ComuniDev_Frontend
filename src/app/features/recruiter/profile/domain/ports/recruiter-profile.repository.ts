import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { RecruiterProfile } from '../../../../../core/domain/models/user.model';

export interface RecruiterProfileRepository {
  getByUserId(userId: string): Observable<RecruiterProfile | null>;
  create(data: CreateRecruiterProfileRequest): Observable<RecruiterProfile>;
  update(id: string, data: UpdateRecruiterProfileRequest): Observable<RecruiterProfile>;
}

export interface CreateRecruiterProfileRequest {
  userId: string;
  cargo?: string;
  ruc?: string;
  lema?: string;
  anioCreacion?: number;
  modalidadTrabajo?: string;
  redesSociales?: { linkedin?: string; instagram?: string; tiktok?: string; facebook?: string };
}

export interface UpdateRecruiterProfileRequest {
  cargo?: string;
  ruc?: string;
  lema?: string;
  anioCreacion?: number;
  modalidadTrabajo?: string;
  redesSociales?: { linkedin?: string; instagram?: string; tiktok?: string; facebook?: string };
}

export const RECRUITER_PROFILE_REPOSITORY = new InjectionToken<RecruiterProfileRepository>('RecruiterProfileRepository');
