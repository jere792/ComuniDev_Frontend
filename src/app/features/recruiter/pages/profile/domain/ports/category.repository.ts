import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { StoryCategory } from '@features/recruiter/pages/profile/domain/models/story-category.model';

export interface CategoryRepository {
  getByUser(userId: string): Observable<StoryCategory[]>;
  create(data: CreateCategoryRequest): Observable<StoryCategory>;
  update(id: string, data: UpdateCategoryRequest): Observable<StoryCategory | null>;
  delete(id: string): Observable<boolean>;
}

export interface CreateCategoryRequest {
  userId: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  orden?: number;
}

export interface UpdateCategoryRequest {
  nombre?: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  orden?: number;
  activa?: boolean;
}

export const CATEGORY_REPOSITORY = new InjectionToken<CategoryRepository>('CategoryRepository');
