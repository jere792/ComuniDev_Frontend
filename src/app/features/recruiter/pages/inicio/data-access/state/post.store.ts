import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialPost } from '@features/recruiter/pages/inicio/domain/models/social-post.model';
import { POST_REPOSITORY, PostRepository } from '@features/recruiter/pages/inicio/domain/ports/post.repository';

@Injectable({ providedIn: 'root' })
export class PostStore {
  private repository = inject<PostRepository>(POST_REPOSITORY);

  readonly posts = signal<SocialPost[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadFeed(userId: string, page = 0, size = 20): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getFeed(userId, page, size).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el feed');
        this.loading.set(false);
      },
    });
  }

  getFeed(userId: string, page = 0, size = 10): Observable<SocialPost[]> {
    return this.repository.getFeed(userId, page, size);
  }

  getPosts(): Observable<SocialPost[]> {
    return this.repository.getPosts();
  }

  createPost(
    autorId: string,
    contenido: { texto?: string; imagenes?: string[] },
    etiquetas?: string[],
    categoria?: string,
    visibilidad?: string
  ): Observable<SocialPost> {
    return this.repository.createPost(autorId, contenido, etiquetas, categoria, visibilidad);
  }

  updatePost(id: string, data: any): Observable<SocialPost> {
    return this.repository.updatePost(id, data);
  }

  deletePost(id: string): Observable<boolean> {
    return this.repository.deletePost(id);
  }

  clear(): void {
    this.posts.set([]);
    this.error.set(null);
  }
}
