import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SocialPost {
  id: string;
  autorId: string;
  tipo: string;
  contenido?: { texto?: string; imagenes?: string[] };
  etiquetas?: string[];
  categoria?: string;
  visibilidad?: string;
  estadoModeracion?: string;
  estadisticas?: { vistas?: number; reaccionesCount?: number; comentariosCount?: number; compartidosCount?: number; guardadosCount?: number };
  createdAt?: string;
  updatedAt?: string;
}

const GET_FEED = gql`
  query GetFeed($userId: String!, $page: Int, $size: Int) {
    feed(userId: $userId, page: $page, size: $size) {
      id
      autorId
      tipo
      contenido { texto imagenes videos archivos bloquesCodigo enlaces }
      etiquetas
      categoria
      visibilidad
      estadoModeracion
      estadisticas { vistas reaccionesCount comentariosCount compartidosCount guardadosCount }
      createdAt
      updatedAt
    }
  }
`;

const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      autorId
      tipo
      contenido { texto imagenes videos archivos bloquesCodigo enlaces }
      etiquetas
      categoria
      visibilidad
      estadoModeracion
      estadisticas { vistas reaccionesCount comentariosCount compartidosCount guardadosCount }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($autorId: String!, $contenido: PostContenidoInput, $etiquetas: [String], $categoria: String, $visibilidad: String) {
    createPost(autorId: $autorId, contenido: $contenido, etiquetas: $etiquetas, categoria: $categoria, visibilidad: $visibilidad) {
      id
      autorId
      tipo
      contenido { texto imagenes }
      etiquetas
      categoria
      visibilidad
      estadoModeracion
      estadisticas { vistas reaccionesCount comentariosCount compartidosCount guardadosCount }
      createdAt
    }
  }
`;

const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $contenido: PostContenidoInput, $etiquetas: [String], $categoria: String, $visibilidad: String) {
    updatePost(id: $id, contenido: $contenido, etiquetas: $etiquetas, categoria: $categoria, visibilidad: $visibilidad) {
      id
      autorId
      contenido { texto imagenes }
      etiquetas
      categoria
      visibilidad
      updatedAt
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

@Injectable({ providedIn: 'root' })
export class PostGraphqlService {
  constructor(private apollo: Apollo) {}

  getFeed(userId: string, page = 0, size = 10): Observable<SocialPost[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_FEED, variables: { userId, page, size } })
      .valueChanges.pipe(map(result => result.data?.feed ?? []));
  }

  getPosts(): Observable<SocialPost[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_POSTS })
      .valueChanges.pipe(map(result => result.data?.posts ?? []));
  }

  createPost(autorId: string, contenido: { texto?: string; imagenes?: string[] }, etiquetas?: string[], categoria?: string, visibilidad?: string): Observable<SocialPost> {
    return this.apollo
      .mutate<any>({ mutation: CREATE_POST, variables: { autorId, contenido, etiquetas, categoria, visibilidad } })
      .pipe(map(result => result.data?.createPost));
  }

  updatePost(id: string, data: any): Observable<SocialPost> {
    return this.apollo
      .mutate<any>({ mutation: UPDATE_POST, variables: { id, ...data } })
      .pipe(map(result => result.data?.updatePost));
  }

  deletePost(id: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: DELETE_POST, variables: { id } })
      .pipe(map(result => result.data?.deletePost ?? false));
  }
}
