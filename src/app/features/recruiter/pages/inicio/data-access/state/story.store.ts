import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialStory, SocialStoryView } from '@features/recruiter/pages/inicio/domain/models/social-story.model';
import { STORY_REPOSITORY, StoryRepository } from '@features/recruiter/pages/inicio/domain/ports/story.repository';

@Injectable({ providedIn: 'root' })
export class StoryStore {
  private repository = inject<StoryRepository>(STORY_REPOSITORY);

  readonly stories = signal<SocialStory[]>([]);
  readonly loading = signal(false);
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

  deleteStory(id: string): Observable<boolean> {
    return this.repository.deleteStory(id);
  }

  clear(): void {
    this.stories.set([]);
    this.error.set(null);
  }
}
