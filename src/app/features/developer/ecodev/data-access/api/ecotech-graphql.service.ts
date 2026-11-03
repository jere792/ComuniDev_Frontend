import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import {
  EcotechImpacto,
  EcotechPost,
  EcotechPostInput,
  EcotechPostsFiltro,
  EcotechTransaction,
  EcotechTransactionsFiltro,
  RecyclingPoint,
} from '@features/developer/ecodev/domain/models/ecodev.model';
import { EcotechRepository } from '@features/developer/ecodev/domain/ports/ecodev.repository';

const POST_FIELDS = `
  id
  autorId
  tipo
  titulo
  descripcion
  categoriaEquipo
  condicion
  imagenes
  ciudad
  distrito
  lat
  lng
  etiquetas
  advertenciaSeguridad
  estado
  interesadosCount
  createdAt
  updatedAt
`;

const ECOTECH_POSTS = gql`
  query EcotechPosts($tipo: String, $categoriaEquipo: String, $estado: String, $page: Int, $size: Int) {
    ecotechPosts(tipo: $tipo, categoriaEquipo: $categoriaEquipo, estado: $estado, page: $page, size: $size) {
      ${POST_FIELDS}
    }
  }
`;

const ECOTECH_POST = gql`
  query EcotechPost($id: ID!) {
    ecotechPost(id: $id) {
      ${POST_FIELDS}
    }
  }
`;

const RECYCLING_POINTS = gql`
  query RecyclingPoints($soloVerificados: Boolean, $page: Int, $size: Int) {
    recyclingPoints(soloVerificados: $soloVerificados, page: $page, size: $size) {
      id
      nombre
      tipo
      organizacion
      descripcion
      pais
      ciudad
      distrito
      direccion
      lat
      lng
      materialesAceptados
      horario
      telefono
      email
      estadoVerificacion
    }
  }
`;

const ECOTECH_TRANSACTIONS = gql`
  query EcotechTransactions($postId: ID, $userId: String, $estado: String, $page: Int, $size: Int) {
    ecotechTransactions(postId: $postId, userId: $userId, estado: $estado, page: $page, size: $size) {
      id
      ecotechPostId
      emisorId
      receptorId
      tipo
      estado
      cantidadEquipos
      confirmadoPorEmisor
      confirmadoPorReceptor
      fechaCompletado
      createdAt
      updatedAt
    }
  }
`;

const ECOTECH_IMPACTO = gql`
  query EcotechImpacto($userId: String) {
    ecotechImpacto(userId: $userId) {
      donaciones
      intercambios
      reciclajes
      reparaciones
      reutilizaciones
      campanas
      equiposTotal
    }
  }
`;

const CREATE_ECOTECH_POST = gql`
  mutation CreateEcotechPost(
    $autorId: String!
    $tipo: String!
    $titulo: String!
    $descripcion: String
    $categoriaEquipo: String!
    $condicion: String!
    $imagenes: [String!]
    $ciudad: String
    $distrito: String
    $lat: Float
    $lng: Float
    $etiquetas: [String!]
    $advertenciaSeguridad: String
  ) {
    createEcotechPost(
      autorId: $autorId
      tipo: $tipo
      titulo: $titulo
      descripcion: $descripcion
      categoriaEquipo: $categoriaEquipo
      condicion: $condicion
      imagenes: $imagenes
      ciudad: $ciudad
      distrito: $distrito
      lat: $lat
      lng: $lng
      etiquetas: $etiquetas
      advertenciaSeguridad: $advertenciaSeguridad
    ) {
      ${POST_FIELDS}
    }
  }
`;

const CONTACT_ECOTECH_POST = gql`
  mutation ContactEcotechPost($postId: ID!, $userId: String!) {
    contactEcotechPost(postId: $postId, userId: $userId) {
      ${POST_FIELDS}
    }
  }
`;

const START_ECOTECH_TRANSACTION = gql`
  mutation StartEcotechTransaction($postId: ID!, $emisorId: String!) {
    startEcotechTransaction(postId: $postId, emisorId: $emisorId) {
      id
      ecotechPostId
      emisorId
      receptorId
      tipo
      estado
      cantidadEquipos
      confirmadoPorEmisor
      confirmadoPorReceptor
      fechaCompletado
      createdAt
      updatedAt
    }
  }
`;

const CONFIRM_ECOTECH_TRANSACTION = gql`
  mutation ConfirmEcotechTransaction($transactionId: ID!, $userId: String!) {
    confirmEcotechTransaction(transactionId: $transactionId, userId: $userId) {
      id
      ecotechPostId
      emisorId
      receptorId
      tipo
      estado
      cantidadEquipos
      confirmadoPorEmisor
      confirmadoPorReceptor
      fechaCompletado
      createdAt
      updatedAt
    }
  }
`;

const CANCEL_ECOTECH_TRANSACTION = gql`
  mutation CancelEcotechTransaction($transactionId: ID!, $userId: String!) {
    cancelEcotechTransaction(transactionId: $transactionId, userId: $userId) {
      id
      ecotechPostId
      emisorId
      receptorId
      tipo
      estado
      cantidadEquipos
      confirmadoPorEmisor
      confirmadoPorReceptor
      fechaCompletado
      createdAt
      updatedAt
    }
  }
`;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length ? value : null;

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && !Number.isNaN(value) ? value : null;

const asInt = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && !Number.isNaN(value) ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function normalizePost(raw: Record<string, unknown>): EcotechPost {
  return {
    id: String(raw['id'] ?? ''),
    autorId: String(raw['autorId'] ?? ''),
    tipo: String(raw['tipo'] ?? ''),
    titulo: String(raw['titulo'] ?? ''),
    descripcion: asString(raw['descripcion']),
    categoriaEquipo: String(raw['categoriaEquipo'] ?? ''),
    condicion: String(raw['condicion'] ?? ''),
    imagenes: asStringArray(raw['imagenes']),
    ciudad: asString(raw['ciudad']),
    distrito: asString(raw['distrito']),
    lat: asNumber(raw['lat']),
    lng: asNumber(raw['lng']),
    etiquetas: asStringArray(raw['etiquetas']),
    advertenciaSeguridad: asString(raw['advertenciaSeguridad']),
    estado: String(raw['estado'] ?? 'ACTIVA'),
    interesadosCount: asInt(raw['interesadosCount']),
    createdAt: asString(raw['createdAt']),
  };
}

function normalizeRecyclingPoint(raw: Record<string, unknown>): RecyclingPoint {
  return {
    id: String(raw['id'] ?? ''),
    nombre: String(raw['nombre'] ?? ''),
    tipo: asString(raw['tipo']),
    organizacion: asString(raw['organizacion']),
    descripcion: asString(raw['descripcion']),
    pais: asString(raw['pais']),
    ciudad: asString(raw['ciudad']),
    distrito: asString(raw['distrito']),
    direccion: asString(raw['direccion']),
    lat: asNumber(raw['lat']),
    lng: asNumber(raw['lng']),
    materialesAceptados: asStringArray(raw['materialesAceptados']),
    horario: asString(raw['horario']),
    telefono: asString(raw['telefono']),
    email: asString(raw['email']),
    estadoVerificacion: String(raw['estadoVerificacion'] ?? 'PENDIENTE'),
  };
}

function normalizeTransaction(raw: Record<string, unknown>): EcotechTransaction {
  return {
    id: String(raw['id'] ?? ''),
    ecotechPostId: String(raw['ecotechPostId'] ?? ''),
    emisorId: String(raw['emisorId'] ?? ''),
    receptorId: String(raw['receptorId'] ?? ''),
    tipo: asString(raw['tipo']),
    estado: String(raw['estado'] ?? 'PENDIENTE_CONFIRMACION'),
    cantidadEquipos: asInt(raw['cantidadEquipos'], 1),
    confirmadoPorEmisor: raw['confirmadoPorEmisor'] === true,
    confirmadoPorReceptor: raw['confirmadoPorReceptor'] === true,
    fechaCompletado: asString(raw['fechaCompletado']),
    createdAt: asString(raw['createdAt']),
  };
}

function normalizeImpacto(raw: Record<string, unknown> | null): EcotechImpacto | null {
  if (!raw) return null;
  return {
    donaciones: asInt(raw['donaciones']),
    intercambios: asInt(raw['intercambios']),
    reciclajes: asInt(raw['reciclajes']),
    reparaciones: asInt(raw['reparaciones']),
    reutilizaciones: asInt(raw['reutilizaciones']),
    campanas: asInt(raw['campanas']),
    equiposTotal: asInt(raw['equiposTotal']),
  };
}

@Injectable({ providedIn: 'root' })
export class EcotechGraphqlService implements EcotechRepository {
  private readonly apollo = inject(Apollo);

  ecotechPosts(filtro: EcotechPostsFiltro = {}): Observable<EcotechPost[]> {
    return this.apollo
      .query<{ ecotechPosts: Array<Record<string, unknown>> | null }>({
        query: ECOTECH_POSTS,
        variables: {
          tipo: filtro.tipo ?? null,
          categoriaEquipo: filtro.categoriaEquipo ?? null,
          estado: filtro.estado ?? null,
          page: filtro.page ?? null,
          size: filtro.size ?? null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.ecotechPosts ?? []).map(normalizePost)));
  }

  ecotechPost(id: string): Observable<EcotechPost | null> {
    return this.apollo
      .query<{ ecotechPost: Record<string, unknown> | null }>({
        query: ECOTECH_POST,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.ecotechPost ? normalizePost(result.data.ecotechPost) : null)));
  }

  recyclingPoints(soloVerificados = true, page?: number, size?: number): Observable<RecyclingPoint[]> {
    return this.apollo
      .query<{ recyclingPoints: Array<Record<string, unknown>> | null }>({
        query: RECYCLING_POINTS,
        variables: { soloVerificados, page: page ?? null, size: size ?? null },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.recyclingPoints ?? []).map(normalizeRecyclingPoint)));
  }

  ecotechTransactions(filtro: EcotechTransactionsFiltro = {}): Observable<EcotechTransaction[]> {
    return this.apollo
      .query<{ ecotechTransactions: Array<Record<string, unknown>> | null }>({
        query: ECOTECH_TRANSACTIONS,
        variables: {
          postId: filtro.postId ?? null,
          userId: filtro.userId ?? null,
          estado: filtro.estado ?? null,
          page: filtro.page ?? null,
          size: filtro.size ?? null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.ecotechTransactions ?? []).map(normalizeTransaction)));
  }

  ecotechImpacto(userId?: string): Observable<EcotechImpacto | null> {
    return this.apollo
      .query<{ ecotechImpacto: Record<string, unknown> | null }>({
        query: ECOTECH_IMPACTO,
        variables: { userId: userId ?? null },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => normalizeImpacto(result.data?.ecotechImpacto ?? null)));
  }

  createEcotechPost(autorId: string, input: EcotechPostInput): Observable<EcotechPost | null> {
    return this.apollo
      .mutate<{ createEcotechPost: Record<string, unknown> | null }>({
        mutation: CREATE_ECOTECH_POST,
        variables: {
          autorId,
          tipo: input.tipo,
          titulo: input.titulo,
          descripcion: input.descripcion ?? null,
          categoriaEquipo: input.categoriaEquipo,
          condicion: input.condicion,
          imagenes: input.imagenes ?? null,
          ciudad: input.ciudad ?? null,
          distrito: input.distrito ?? null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          etiquetas: input.etiquetas ?? null,
          advertenciaSeguridad: input.advertenciaSeguridad ?? null,
        },
      })
      .pipe(map((result) => (result.data?.createEcotechPost ? normalizePost(result.data.createEcotechPost) : null)));
  }

  contactEcotechPost(postId: string, userId: string): Observable<EcotechPost | null> {
    return this.apollo
      .mutate<{ contactEcotechPost: Record<string, unknown> | null }>({
        mutation: CONTACT_ECOTECH_POST,
        variables: { postId, userId },
      })
      .pipe(map((result) => (result.data?.contactEcotechPost ? normalizePost(result.data.contactEcotechPost) : null)));
  }

  startEcotechTransaction(postId: string, emisorId: string): Observable<EcotechTransaction | null> {
    return this.apollo
      .mutate<{ startEcotechTransaction: Record<string, unknown> | null }>({
        mutation: START_ECOTECH_TRANSACTION,
        variables: { postId, emisorId },
      })
      .pipe(
        map((result) =>
          result.data?.startEcotechTransaction ? normalizeTransaction(result.data.startEcotechTransaction) : null,
        ),
      );
  }

  confirmEcotechTransaction(transactionId: string, userId: string): Observable<EcotechTransaction | null> {
    return this.apollo
      .mutate<{ confirmEcotechTransaction: Record<string, unknown> | null }>({
        mutation: CONFIRM_ECOTECH_TRANSACTION,
        variables: { transactionId, userId },
      })
      .pipe(
        map((result) =>
          result.data?.confirmEcotechTransaction ? normalizeTransaction(result.data.confirmEcotechTransaction) : null,
        ),
      );
  }

  cancelEcotechTransaction(transactionId: string, userId: string): Observable<EcotechTransaction | null> {
    return this.apollo
      .mutate<{ cancelEcotechTransaction: Record<string, unknown> | null }>({
        mutation: CANCEL_ECOTECH_TRANSACTION,
        variables: { transactionId, userId },
      })
      .pipe(
        map((result) =>
          result.data?.cancelEcotechTransaction ? normalizeTransaction(result.data.cancelEcotechTransaction) : null,
        ),
      );
  }
}
