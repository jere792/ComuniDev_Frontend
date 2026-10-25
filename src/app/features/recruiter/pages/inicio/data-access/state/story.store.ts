import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialStory, SocialStoryView, StoryComment } from '@features/recruiter/pages/inicio/domain/models/social-story.model';
import { STORY_REPOSITORY, StoryRepository } from '@features/recruiter/pages/inicio/domain/ports/story.repository';

@Injectable({ providedIn: 'root' })
export class StoryStore {
  private repository = inject<StoryRepository>(STORY_REPOSITORY);

  readonly stories = signal<SocialStory[]>([]);
  readonly userStories = signal<SocialStory[]>([]);
  readonly loading = signal(false);
  readonly loadingUserStories = signal(false);
  readonly error = signal<string | null>(null);

  loadStories(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getStories(userId).subscribe({
      next: (stories) => {
        this.stories.set(stories);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar historias');
        this.loading.set(false);
      },
    });
  }

  getStories(userId: string): Observable<SocialStory[]> {
    return this.repository.getStories(userId);
  }

  loadUserStories(userId: string, categoriaId?: string): void {
    this.loadingUserStories.set(true);
    this.error.set(null);
    this.repository.getAllByUser(userId, categoriaId).subscribe({
      next: (stories) => {
        this.userStories.set(stories);
        this.loadingUserStories.set(false);
      },
      error: () => {
        this.error.set('Error al cargar historias');
        this.loadingUserStories.set(false);
      },
    });
  }

  updateCategorias(storyId: string, categoriaIds: string[]): Observable<SocialStory | null> {
    return this.repository.updateCategorias(storyId, categoriaIds);
  }

  createStory(
    autorId: string,
    contenido: { texto?: string; imagenUrl?: string; videoUrl?: string; musica?: any },
    visibilidad?: string
  ): Observable<SocialStory> {
    return this.repository.createStory(autorId, contenido, visibilidad);
  }

  viewStory(storyId: string, viewerId: string): Observable<SocialStoryView> {
    return this.repository.viewStory(storyId, viewerId);
  }

  getStoryViews(storyId: string): Observable<SocialStoryView[]> {
    return this.repository.getStoryViews(storyId);
  }

  getStoryComments(storyId: string): Observable<StoryComment[]> {
    return this.repository.getStoryComments(storyId);
  }

  createStoryComment(storyId: string, autorId: string, texto: string): Observable<StoryComment> {
    return this.repository.createStoryComment(storyId, autorId, texto);
  }

  deleteStory(id: string): Observable<boolean> {
    return this.repository.deleteStory(id);
  }

  clear(): void {
    this.stories.set([]);
    this.userStories.set([]);
    this.loadingUserStories.set(false);
    this.error.set(null);
  }
}
