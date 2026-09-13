import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SocialStory {
  id: string;
  autorId: string;
  contenido?: { texto?: string; imagenUrl?: string; videoUrl?: string; musica?: string };
  visibilidad?: string;
  fechaExpiracion?: string;
  vistasCount?: number;
  reaccionesCount?: number;
  estado?: string;
  createdAt?: string;
}

export interface SocialStoryView {
  id: string;
  storyId: string;
  viewerId: string;
  viewedAt?: string;
}

const GET_STORIES = gql`
  query GetStories($userId: String!) {
    stories(userId: $userId) {
      id
      autorId
      contenido { texto imagenUrl videoUrl musica }
      visibilidad
      fechaExpiracion
      vistasCount
      reaccionesCount
      estado
      createdAt
    }
  }
`;

const CREATE_STORY = gql`
  mutation CreateStory($autorId: String!, $contenido: StoryContenidoInput, $visibilidad: String) {
    createStory(autorId: $autorId, contenido: $contenido, visibilidad: $visibilidad) {
      id
      autorId
      contenido { texto imagenUrl videoUrl musica }
      visibilidad
      fechaExpiracion
      vistasCount
      reaccionesCount
      estado
      createdAt
    }
  }
`;

const VIEW_STORY = gql`
  mutation ViewStory($storyId: String!, $viewerId: String!) {
    viewStory(storyId: $storyId, viewerId: $viewerId) {
      id
      storyId
      viewerId
      viewedAt
    }
  }
`;

const GET_STORY_VIEWS = gql`
  query GetStoryViews($storyId: String!) {
    storyViews(storyId: $storyId) {
      id
      storyId
      viewerId
      viewedAt
    }
  }
`;

const DELETE_STORY = gql`
  mutation DeleteStory($id: ID!) {
    deleteStory(id: $id)
  }
`;

@Injectable({ providedIn: 'root' })
export class StoryGraphqlService {
  constructor(private apollo: Apollo) {}

  getStories(userId: string): Observable<SocialStory[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_STORIES, variables: { userId } })
      .valueChanges.pipe(map(result => result.data?.stories ?? []));
  }

  createStory(autorId: string, contenido: { texto?: string; imagenUrl?: string; videoUrl?: string; musica?: string }, visibilidad?: string): Observable<SocialStory> {
    return this.apollo
      .mutate<any>({ mutation: CREATE_STORY, variables: { autorId, contenido, visibilidad } })
      .pipe(map(result => result.data?.createStory));
  }

  viewStory(storyId: string, viewerId: string): Observable<SocialStoryView> {
    return this.apollo
      .mutate<any>({ mutation: VIEW_STORY, variables: { storyId, viewerId } })
      .pipe(map(result => result.data?.viewStory));
  }

  getStoryViews(storyId: string): Observable<SocialStoryView[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_STORY_VIEWS, variables: { storyId } })
      .valueChanges.pipe(map(result => result.data?.storyViews ?? []));
  }

  deleteStory(id: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: DELETE_STORY, variables: { id } })
      .pipe(map(result => result.data?.deleteStory ?? false));
  }
}
