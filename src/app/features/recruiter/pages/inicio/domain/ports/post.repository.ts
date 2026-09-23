import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialPost } from '@features/recruiter/pages/inicio/domain/models/social-post.model';

export interface PostRepository {
  getFeed(userId: string, page?: number, size?: number): Observable<SocialPost[]>;
  getPosts(): Observable<SocialPost[]>;
  createPost(
    autorId: string,
    contenido: { texto?: string; imagenes?: string[] },
    etiquetas?: string[],
    categoria?: string,
    visibilidad?: string
  ): Observable<SocialPost>;
  updatePost(id: string, data: any): Observable<SocialPost>;
  deletePost(id: string): Observable<boolean>;
}

export const POST_REPOSITORY = new InjectionToken<PostRepository>('PostRepository');
