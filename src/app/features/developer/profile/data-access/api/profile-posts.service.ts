import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Publicación resumida para mostrarla en el perfil. */
export interface ProfilePost {
  id: string;
  tipo: string;
  texto: string;
  imagenes: string[];
  categoria: string | null;
  createdAt: string | null;
  reaccionesCount: number;
  comentariosCount: number;
}

const POSTS_BY_USER = gql`
  query PostsByUser($autorId: String!, $page: Int, $size: Int) {
    postsByUser(autorId: $autorId, page: $page, size: $size) {
      id
      tipo
      categoria
      createdAt
      contenido {
        texto
        imagenes
      }
      estadisticas {
        reaccionesCount
        comentariosCount
      }
    }
  }
`;

/** Publicaciones de un usuario para la pestaña del perfil. */
@Injectable({ providedIn: 'root' })
export class ProfilePostsService {
  private apollo = inject(Apollo);

  getByUser(autorId: string, page = 0, size = 10): Observable<ProfilePost[]> {
    return this.apollo
      .query<any>({
        query: POSTS_BY_USER,
        variables: { autorId, page, size },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((res) =>
          ((res.data?.postsByUser ?? []) as any[]).map((post) => ({
            id: String(post.id ?? ''),
            tipo: String(post.tipo ?? ''),
            texto: post.contenido?.texto ?? '',
            imagenes: Array.isArray(post.contenido?.imagenes) ? post.contenido.imagenes : [],
            categoria: post.categoria ?? null,
            createdAt: post.createdAt ?? null,
            reaccionesCount: post.estadisticas?.reaccionesCount ?? 0,
            comentariosCount: post.estadisticas?.comentariosCount ?? 0,
          })),
        ),
      );
  }
}
