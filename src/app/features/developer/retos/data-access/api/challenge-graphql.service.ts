import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import {
  Challenge,
  ChallengeSubmission,
} from '@features/developer/retos/domain/models/challenge.model';
import { ChallengeRepository } from '@features/developer/retos/domain/ports/challenge.repository';

const CHALLENGE_FIELDS = `
  id
  titulo
  enunciado
  lenguaje
  tipo
  opciones
  respuestaCorrecta
  codigoInicial
  solucionReferencia
  explicacion
  dificultad
  etiquetas
  fecha
`;

const SUBMISSION_FIELDS = `
  id
  challengeId
  userId
  respuesta
  codigo
  estado
  feedback
  puntosOtorgados
  validadoPor
  createdAt
  updatedAt
  challenge {
    ${CHALLENGE_FIELDS}
  }
`;

const DAILY_CHALLENGE = gql`
  query DailyChallenge($fecha: String, $userId: String) {
    dailyChallenge(fecha: $fecha, userId: $userId) {
      ${CHALLENGE_FIELDS}
    }
  }
`;

const MY_CHALLENGE_SUBMISSION = gql`
  query MyChallengeSubmission($challengeId: String!, $userId: String!) {
    myChallengeSubmission(challengeId: $challengeId, userId: $userId) {
      ${SUBMISSION_FIELDS}
    }
  }
`;

const CHALLENGE_HISTORY = gql`
  query ChallengeHistory($userId: String!, $page: Int, $size: Int) {
    challengeHistory(userId: $userId, page: $page, size: $size) {
      ${SUBMISSION_FIELDS}
    }
  }
`;

const SUBMIT_CHALLENGE_ANSWER = gql`
  mutation SubmitChallengeAnswer($userId: String!, $challengeId: String!, $respuesta: Int, $codigo: String) {
    submitChallengeAnswer(userId: $userId, challengeId: $challengeId, respuesta: $respuesta, codigo: $codigo) {
      ${SUBMISSION_FIELDS}
    }
  }
`;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length ? value : null;

const asInt = (value: unknown): number | null =>
  typeof value === 'number' && !Number.isNaN(value) ? value : null;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function normalizeChallenge(raw: Record<string, unknown> | null): Challenge | null {
  if (!raw) return null;
  return {
    id: String(raw['id'] ?? ''),
    titulo: String(raw['titulo'] ?? ''),
    enunciado: String(raw['enunciado'] ?? ''),
    lenguaje: asString(raw['lenguaje']),
    tipo: String(raw['tipo'] ?? 'TEORICO'),
    opciones: Array.isArray(raw['opciones']) ? asStringArray(raw['opciones']) : null,
    respuestaCorrecta: asInt(raw['respuestaCorrecta']),
    codigoInicial: asString(raw['codigoInicial']),
    solucionReferencia: asString(raw['solucionReferencia']),
    explicacion: asString(raw['explicacion']),
    dificultad: asString(raw['dificultad']),
    etiquetas: Array.isArray(raw['etiquetas']) ? asStringArray(raw['etiquetas']) : null,
    fecha: asString(raw['fecha']),
  };
}

function normalizeSubmission(raw: Record<string, unknown> | null): ChallengeSubmission | null {
  if (!raw) return null;
  const challengeRaw = raw['challenge'];
  return {
    id: String(raw['id'] ?? ''),
    challengeId: String(raw['challengeId'] ?? ''),
    challenge:
      challengeRaw && typeof challengeRaw === 'object'
        ? normalizeChallenge(challengeRaw as Record<string, unknown>)
        : null,
    userId: String(raw['userId'] ?? ''),
    respuesta: asInt(raw['respuesta']),
    codigo: asString(raw['codigo']),
    estado: String(raw['estado'] ?? ''),
    feedback: asString(raw['feedback']),
    puntosOtorgados: asInt(raw['puntosOtorgados']),
    validadoPor: asString(raw['validadoPor']),
    createdAt: asString(raw['createdAt']),
  };
}

@Injectable({ providedIn: 'root' })
export class ChallengeGraphqlService implements ChallengeRepository {
  private readonly apollo = inject(Apollo);

  dailyChallenge(fecha: string | null, userId: string | null): Observable<Challenge | null> {
    return this.apollo
      .query<{ dailyChallenge: Record<string, unknown> | null }>({
        query: DAILY_CHALLENGE,
        variables: { fecha, userId },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => normalizeChallenge(result.data?.dailyChallenge ?? null)));
  }

  myChallengeSubmission(challengeId: string, userId: string): Observable<ChallengeSubmission | null> {
    return this.apollo
      .query<{ myChallengeSubmission: Record<string, unknown> | null }>({
        query: MY_CHALLENGE_SUBMISSION,
        variables: { challengeId, userId },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => normalizeSubmission(result.data?.myChallengeSubmission ?? null)));
  }

  challengeHistory(userId: string, page?: number, size?: number): Observable<ChallengeSubmission[]> {
    return this.apollo
      .query<{ challengeHistory: Array<Record<string, unknown>> | null }>({
        query: CHALLENGE_HISTORY,
        variables: { userId, page: page ?? null, size: size ?? null },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) =>
          (result.data?.challengeHistory ?? [])
            .map((raw) => normalizeSubmission(raw))
            .filter((item): item is ChallengeSubmission => !!item),
        ),
      );
  }

  submitChallengeAnswer(
    userId: string,
    challengeId: string,
    respuesta: number | null,
    codigo: string | null,
  ): Observable<ChallengeSubmission | null> {
    return this.apollo
      .mutate<{ submitChallengeAnswer: Record<string, unknown> | null }>({
        mutation: SUBMIT_CHALLENGE_ANSWER,
        variables: { userId, challengeId, respuesta, codigo },
      })
      .pipe(map((result) => normalizeSubmission(result.data?.submitChallengeAnswer ?? null)));
  }
}
