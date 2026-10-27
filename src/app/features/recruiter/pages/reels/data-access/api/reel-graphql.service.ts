import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SocialReel } from '@features/recruiter/pages/reels/domain/models/social-reel.model';
import { CreateReelRequest, ReelRepository, UpdateReelRequest } from '@features/recruiter/pages/reels/domain/ports/reel.repository';

const GET_REELS = gql`
  query GetReels($page: Int, $size: Int) {
    reels(page: $page, size: $size) {
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
  query GetReelsByUser($userId: String!, $page: Int, $size: Int) {
    reelsByUser(userId: $userId, page: $page, size: $size) {
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
  mutation UpdateReel($id: ID!, $autorId: String!, $descripcion: String, $etiquetas: [String], $visibilidad: String) {
    updateReel(id: $id, autorId: $autorId, descripcion: $descripcion, etiquetas: $etiquetas, visibilidad: $visibilidad) {
      id
      descripcion
      etiquetas
      visibilidad
    }
  }
`;

const DELETE_REEL = gql`
  mutation DeleteReel($id: ID!, $autorId: String!) {
    deleteReel(id: $id, autorId: $autorId)
  }
`;

const GET_SAVED_REELS = gql`
  query GetSavedReels($userId: String!) {
    savedReels(userId: $userId) {
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

const IS_REEL_SAVED = gql`
  query IsReelSaved($userId: String!, $reelId: ID!) {
    isReelSaved(userId: $userId, reelId: $reelId)
  }
`;

const SAVE_REEL = gql`
  mutation SaveReel($userId: String!, $reelId: ID!) {
    saveReel(userId: $userId, reelId: $reelId)
  }
`;

const UNSAVE_REEL = gql`
  mutation UnsaveReel($userId: String!, $reelId: ID!) {
    unsaveReel(userId: $userId, reelId: $reelId)
  }
`;

const INCREMENT_REEL_VIEW = gql`
  mutation IncrementReelView($reelId: ID!, $userId: String) {
    incrementReelView(reelId: $reelId, userId: $userId)
  }
`;

@Injectable({ providedIn: 'root' })
export class ReelGraphqlService implements ReelRepository {
  private apollo = inject(Apollo);


  /** Ventana de 30 reels por defecto (feed y pestaña de perfil); el backend pagina. */
  getReels(page = 0, size = 30): Observable<SocialReel[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_REELS, variables: { page, size } })
      .valueChanges.pipe(map(result => result.data?.reels ?? []));
  }

  getReelsByUser(userId: string, page = 0, size = 30): Observable<SocialReel[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_REELS_BY_USER, variables: { userId, page, size } })
      .valueChanges.pipe(map(result => result.data?.reelsByUser ?? []));
  }

  savedReels(userId: string): Observable<SocialReel[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_SAVED_REELS, variables: { userId } })
      .valueChanges.pipe(map(result => result.data?.savedReels ?? []));
  }

  isReelSaved(userId: string, reelId: string): Observable<boolean> {
    return this.apollo
      .watchQuery<any>({ query: IS_REEL_SAVED, variables: { userId, reelId } })
      .valueChanges.pipe(map(result => result.data?.isReelSaved ?? false));
  }

  createReel(data: CreateReelRequest): Observable<SocialReel> {
    return this.apollo
      .mutate<any>({ mutation: CREATE_REEL, variables: data })
      .pipe(map(result => result.data?.createReel));
  }

  updateReel(id: string, autorId: string, data: UpdateReelRequest): Observable<SocialReel> {
    return this.apollo
      .mutate<any>({ mutation: UPDATE_REEL, variables: { id, autorId, ...data } })
      .pipe(map(result => result.data?.updateReel));
  }

  deleteReel(id: string, autorId: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: DELETE_REEL, variables: { id, autorId } })
      .pipe(map(result => result.data?.deleteReel ?? false));
  }

  saveReel(userId: string, reelId: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: SAVE_REEL, variables: { userId, reelId } })
      .pipe(map(result => result.data?.saveReel ?? false));
  }

  unsaveReel(userId: string, reelId: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: UNSAVE_REEL, variables: { userId, reelId } })
      .pipe(map(result => result.data?.unsaveReel ?? false));
  }

  incrementReelView(reelId: string, userId?: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: INCREMENT_REEL_VIEW, variables: { reelId, userId } })
      .pipe(map(result => result.data?.incrementReelView ?? false));
  }
}
