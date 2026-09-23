import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SocialReel } from '@features/recruiter/pages/reels/domain/models/social-reel.model';
import { CreateReelRequest, ReelRepository, UpdateReelRequest } from '@features/recruiter/pages/reels/domain/ports/reel.repository';

const GET_REELS = gql`
  query GetReels {
    reels {
      id
      autorId
      videoUrl
      portadaUrl
      descripcion
      etiquetas
      musica { titulo artista }
      duracionSegundos
      visibilidad
      estadoModeracion
      estadisticas { vistas reaccionesCount comentariosCount compartidosCount guardadosCount }
      createdAt
    }
  }
`;

const GET_REELS_BY_USER = gql`
  query GetReelsByUser($userId: String!) {
    reelsByUser(userId: $userId) {
      id
      autorId
      videoUrl
      portadaUrl
      descripcion
      etiquetas
      musica { titulo artista }
      duracionSegundos
      visibilidad
      estadoModeracion
      estadisticas { vistas reaccionesCount comentariosCount compartidosCount guardadosCount }
      createdAt
    }
  }
`;

const CREATE_REEL = gql`
  mutation CreateReel($autorId: String!, $videoUrl: String!, $portadaUrl: String, $descripcion: String, $etiquetas: [String], $musica: ReelMusicaInput, $duracionSegundos: Int, $visibilidad: String) {
    createReel(autorId: $autorId, videoUrl: $videoUrl, portadaUrl: $portadaUrl, descripcion: $descripcion, etiquetas: $etiquetas, musica: $musica, duracionSegundos: $duracionSegundos, visibilidad: $visibilidad) {
      id
      autorId
      videoUrl
      portadaUrl
      descripcion
      etiquetas
      musica { titulo artista }
      duracionSegundos
      visibilidad
      estadoModeracion
      estadisticas { vistas reaccionesCount comentariosCount compartidosCount guardadosCount }
      createdAt
    }
  }
`;

const UPDATE_REEL = gql`
  mutation UpdateReel($id: ID!, $descripcion: String, $etiquetas: [String], $visibilidad: String) {
    updateReel(id: $id, descripcion: $descripcion, etiquetas: $etiquetas, visibilidad: $visibilidad) {
      id
      descripcion
      etiquetas
      visibilidad
    }
  }
`;

const DELETE_REEL = gql`
  mutation DeleteReel($id: ID!) {
    deleteReel(id: $id)
  }
`;

@Injectable({ providedIn: 'root' })
export class ReelGraphqlService implements ReelRepository {
  private apollo = inject(Apollo);


  getReels(): Observable<SocialReel[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_REELS })
      .valueChanges.pipe(map(result => result.data?.reels ?? []));
  }

  getReelsByUser(userId: string): Observable<SocialReel[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_REELS_BY_USER, variables: { userId } })
      .valueChanges.pipe(map(result => result.data?.reelsByUser ?? []));
  }

  createReel(data: CreateReelRequest): Observable<SocialReel> {
    return this.apollo
      .mutate<any>({ mutation: CREATE_REEL, variables: data })
      .pipe(map(result => result.data?.createReel));
  }

  updateReel(id: string, data: UpdateReelRequest): Observable<SocialReel> {
    return this.apollo
      .mutate<any>({ mutation: UPDATE_REEL, variables: { id, ...data } })
      .pipe(map(result => result.data?.updateReel));
  }

  deleteReel(id: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: DELETE_REEL, variables: { id } })
      .pipe(map(result => result.data?.deleteReel ?? false));
  }
}
