import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialStory, SocialStoryView, StoryComment } from '@features/recruiter/pages/inicio/domain/models/social-story.model';

export interface StoryRepository {
  getStories(userId: string): Observable<SocialStory[]>;
  getAllByUser(userId: string, categoriaId?: string): Observable<SocialStory[]>;
  createStory(
    autorId: string,
    contenido: { texto?: string; imagenUrl?: string; videoUrl?: string; musica?: any },
    visibilidad?: string
  ): Observable<SocialStory>;
  updateCategorias(storyId: string, categoriaIds: string[]): Observable<SocialStory | null>;
  viewStory(storyId: string, viewerId: string): Observable<SocialStoryView>;
  getStoryViews(storyId: string): Observable<SocialStoryView[]>;
  getStoryComments(storyId: string): Observable<StoryComment[]>;
  createStoryComment(storyId: string, autorId: string, texto: string): Observable<StoryComment>;
  deleteStory(id: string): Observable<boolean>;
}

export const STORY_REPOSITORY = new InjectionToken<StoryRepository>('StoryRepository');
