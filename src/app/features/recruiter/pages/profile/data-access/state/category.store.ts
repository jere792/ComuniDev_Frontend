import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StoryCategory } from '@features/recruiter/pages/profile/domain/models/story-category.model';
import {
  CATEGORY_REPOSITORY,
  CategoryRepository,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@features/recruiter/pages/profile/domain/ports/category.repository';

@Injectable({ providedIn: 'root' })
export class CategoryStore {
  private repository = inject<CategoryRepository>(CATEGORY_REPOSITORY);

  readonly categories = signal<StoryCategory[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasCategories = computed(() => this.categories().length > 0);

  load(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getByUser(userId).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar categorías');
        this.loading.set(false);
      },
    });
  }

  create(data: CreateCategoryRequest): Observable<StoryCategory> {
    return this.repository.create(data);
  }

  update(id: string, data: UpdateCategoryRequest): Observable<StoryCategory | null> {
    return this.repository.update(id, data);
  }

  delete(id: string): Observable<boolean> {
    return this.repository.delete(id);
  }

  clear(): void {
    this.categories.set([]);
    this.error.set(null);
  }
}
