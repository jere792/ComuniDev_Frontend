import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import {
  Badge,
  PointTransaction,
  RankingPosicion,
  RankingPuntos,
  UserBadge,
  UserPoints,
} from '@features/developer/gamificacion/domain/models/points.model';
import { PointsRepository } from '@features/developer/gamificacion/domain/ports/points.repository';

const USER_POINTS = gql`
  query UserPoints($userId: String!) {
    userPoints(userId: $userId) {
      id
      userId
      puntosTotales
      nivel
      rango
      progresoNivel
      puntosBaseNivel
      puntosParaSiguienteNivel
      puntosFaltantes
      puntosPorCategoria {
        nombre
        puntos
      }
      ultimaActualizacion
    }
  }
`;

const RANKING_POINTS = gql`
  query RankingPoints($size: Int) {
    rankingPoints(size: $size) {
      posicion
      puntos {
        userId
        puntosTotales
        nivel
        rango
        progresoNivel
        puntosFaltantes
      }
      nombre
      nombreUsuario
      fotoPerfilUrl
    }
  }
`;

const BADGES_CATALOG = gql`
  query BadgesCatalog {
    badgesCatalog {
      id
      codigo
      nombre
      descripcion
      icono
      criterioTipo
      valorMinimo
    }
  }
`;

const USER_BADGES = gql`
  query UserBadges($userId: String!) {
    userBadges(userId: $userId) {
      id
      userId
      codigo
      obtenidaEn
    }
  }
`;

const POINTS_HISTORY = gql`
  query PointsHistory($userId: String!, $page: Int, $size: Int) {
    pointsHistory(userId: $userId, page: $page, size: $size) {
      id
      userId
      tipoAccion
      categoria
      puntos
      descripcion
      referenciaTipo
      referenciaId
      createdAt
    }
  }
`;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length ? value : null;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && !Number.isNaN(value) ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function normalizeUserPoints(raw: Record<string, unknown>): UserPoints {
  const categorias = Array.isArray(raw['puntosPorCategoria']) ? raw['puntosPorCategoria'] : [];
  return {
    id: String(raw['id'] ?? ''),
    userId: String(raw['userId'] ?? ''),
    puntosTotales: asNumber(raw['puntosTotales']),
    nivel: asNumber(raw['nivel'], 1),
    rango: String(raw['rango'] ?? 'BRONCE'),
    progresoNivel: asNumber(raw['progresoNivel']),
    puntosBaseNivel: asNumber(raw['puntosBaseNivel']),
    puntosParaSiguienteNivel: asNumber(raw['puntosParaSiguienteNivel']),
    puntosFaltantes: asNumber(raw['puntosFaltantes']),
    puntosPorCategoria: categorias
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((item) => ({
        nombre: String(item['nombre'] ?? ''),
        puntos: asNumber(item['puntos']),
      })),
    ultimaActualizacion: asString(raw['ultimaActualizacion']),
  };
}

function normalizeRankingPuntos(raw: Record<string, unknown>): RankingPuntos {
  return {
    userId: String(raw['userId'] ?? ''),
    puntosTotales: asNumber(raw['puntosTotales']),
    nivel: asNumber(raw['nivel'], 1),
    rango: String(raw['rango'] ?? 'BRONCE'),
    progresoNivel: asNumber(raw['progresoNivel']),
    puntosFaltantes: asNumber(raw['puntosFaltantes']),
  };
}

function normalizeBadge(raw: Record<string, unknown>): Badge {
  return {
    id: String(raw['id'] ?? ''),
    codigo: String(raw['codigo'] ?? ''),
    nombre: String(raw['nombre'] ?? ''),
    descripcion: asString(raw['descripcion']),
    icono: asString(raw['icono']),
    criterioTipo: asString(raw['criterioTipo']),
    valorMinimo: typeof raw['valorMinimo'] === 'number' ? raw['valorMinimo'] : null,
  };
}

@Injectable({ providedIn: 'root' })
export class PointsGraphqlService implements PointsRepository {
  private readonly apollo = inject(Apollo);

  userPoints(userId: string): Observable<UserPoints | null> {
    return this.apollo
      .query<{ userPoints: Record<string, unknown> | null }>({
        query: USER_POINTS,
        variables: { userId },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.userPoints ? normalizeUserPoints(result.data.userPoints) : null)));
  }

  rankingPoints(size?: number): Observable<RankingPosicion[]> {
    return this.apollo
      .query<{ rankingPoints: Array<Record<string, unknown>> | null }>({
        query: RANKING_POINTS,
        variables: { size: size ?? null },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) =>
          (result.data?.rankingPoints ?? []).map((raw) => {
            const puntos = (raw['puntos'] ?? {}) as Record<string, unknown>;
            return {
              posicion: asNumber(raw['posicion']),
              puntos: normalizeRankingPuntos(puntos),
              nombre: asString(raw['nombre']),
              nombreUsuario: asString(raw['nombreUsuario']),
              fotoPerfilUrl: asString(raw['fotoPerfilUrl']),
            };
          }),
        ),
      );
  }

  badgesCatalog(): Observable<Badge[]> {
    return this.apollo
      .query<{ badgesCatalog: Array<Record<string, unknown>> | null }>({
        query: BADGES_CATALOG,
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.badgesCatalog ?? []).map(normalizeBadge)));
  }

  userBadges(userId: string): Observable<UserBadge[]> {
    return this.apollo
      .query<{ userBadges: Array<Record<string, unknown>> | null }>({
        query: USER_BADGES,
        variables: { userId },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) =>
          (result.data?.userBadges ?? []).map((raw) => ({
            id: String(raw['id'] ?? ''),
            userId: String(raw['userId'] ?? ''),
            codigo: String(raw['codigo'] ?? ''),
            obtenidaEn: asString(raw['obtenidaEn']),
          })),
        ),
      );
  }

  pointsHistory(userId: string, page?: number, size?: number): Observable<PointTransaction[]> {
    return this.apollo
      .query<{ pointsHistory: Array<Record<string, unknown>> | null }>({
        query: POINTS_HISTORY,
        variables: { userId, page: page ?? null, size: size ?? null },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) =>
          (result.data?.pointsHistory ?? []).map((raw) => ({
            id: String(raw['id'] ?? ''),
            userId: String(raw['userId'] ?? ''),
            tipoAccion: String(raw['tipoAccion'] ?? ''),
            categoria: String(raw['categoria'] ?? ''),
            puntos: asNumber(raw['puntos']),
            descripcion: asString(raw['descripcion']),
            referenciaTipo: asString(raw['referenciaTipo']),
            referenciaId: asString(raw['referenciaId']),
            createdAt: asString(raw['createdAt']),
          })),
        ),
      );
  }
}
