import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import {
  Answer,
  Question,
  QuestionFilters,
  QuestionInput,
  QuestionUpdateInput,
} from '@features/developer/qa/domain/models/question.model';
import { QuestionRepository } from '@features/developer/qa/domain/ports/question.repository';

const QUESTION_FIELDS = `
  id
  autorId
  titulo
  descripcion
  codigoEjemplo
  etiquetas
  categoria
  estado
  respuestaAceptadaId
  votosCount
  respuestasCount
  vistasCount
  oculto
  createdAt
  updatedAt
`;

const ANSWER_FIELDS = `
  id
  questionId
  autorId
  contenido
  codigoEjemplo
  votosCount
  aceptada
  oculto
  createdAt
  updatedAt
`;

const QUESTIONS = gql`
  query Questions(
    $categoria: String
    $etiqueta: String
    $estado: String
    $q: String
    $page: Int
    $size: Int
  ) {
    questions(
      categoria: $categoria
      etiqueta: $etiqueta
      estado: $estado
      q: $q
      page: $page
      size: $size
    ) {
      ${QUESTION_FIELDS}
    }
  }
`;

const QUESTION = gql`
  query Question($id: ID!) {
    question(id: $id) {
      ${QUESTION_FIELDS}
    }
  }
`;

const ANSWERS = gql`
  query Answers($questionId: ID!, $page: Int, $size: Int) {
    answers(questionId: $questionId, page: $page, size: $size) {
      ${ANSWER_FIELDS}
    }
  }
`;

const MY_QUESTIONS = gql`
  query MyQuestions($autorId: String!, $page: Int, $size: Int) {
    myQuestions(autorId: $autorId, page: $page, size: $size) {
      ${QUESTION_FIELDS}
    }
  }
`;

const CREATE_QUESTION = gql`
  mutation CreateQuestion(
    $autorId: String!
    $titulo: String!
    $descripcion: String!
    $codigoEjemplo: String
    $etiquetas: [String!]!
    $categoria: String
  ) {
    createQuestion(
      autorId: $autorId
      titulo: $titulo
      descripcion: $descripcion
      codigoEjemplo: $codigoEjemplo
      etiquetas: $etiquetas
      categoria: $categoria
    ) {
      ${QUESTION_FIELDS}
    }
  }
`;

const UPDATE_QUESTION = gql`
  mutation UpdateQuestion(
    $id: ID!
    $actorId: String!
    $titulo: String
    $descripcion: String
    $codigoEjemplo: String
    $etiquetas: [String!]
    $categoria: String
  ) {
    updateQuestion(
      id: $id
      actorId: $actorId
      titulo: $titulo
      descripcion: $descripcion
      codigoEjemplo: $codigoEjemplo
      etiquetas: $etiquetas
      categoria: $categoria
    ) {
      ${QUESTION_FIELDS}
    }
  }
`;

const DELETE_QUESTION = gql`
  mutation DeleteQuestion($id: ID!, $actorId: String!) {
    deleteQuestion(id: $id, actorId: $actorId)
  }
`;

const CREATE_ANSWER = gql`
  mutation CreateAnswer(
    $questionId: ID!
    $autorId: String!
    $contenido: String!
    $codigoEjemplo: String
  ) {
    createAnswer(
      questionId: $questionId
      autorId: $autorId
      contenido: $contenido
      codigoEjemplo: $codigoEjemplo
    ) {
      ${ANSWER_FIELDS}
    }
  }
`;

const UPDATE_ANSWER = gql`
  mutation UpdateAnswer(
    $id: ID!
    $actorId: String!
    $contenido: String
    $codigoEjemplo: String
  ) {
    updateAnswer(id: $id, actorId: $actorId, contenido: $contenido, codigoEjemplo: $codigoEjemplo) {
      ${ANSWER_FIELDS}
    }
  }
`;

const DELETE_ANSWER = gql`
  mutation DeleteAnswer($id: ID!, $actorId: String!) {
    deleteAnswer(id: $id, actorId: $actorId)
  }
`;

const VOTE_QUESTION = gql`
  mutation VoteQuestion($questionId: ID!, $userId: String!, $valor: Int!) {
    voteQuestion(questionId: $questionId, userId: $userId, valor: $valor)
  }
`;

const VOTE_ANSWER = gql`
  mutation VoteAnswer($answerId: ID!, $userId: String!, $valor: Int!) {
    voteAnswer(answerId: $answerId, userId: $userId, valor: $valor)
  }
`;

const ACCEPT_ANSWER = gql`
  mutation AcceptAnswer($questionId: ID!, $answerId: ID!, $actorId: String!) {
    acceptAnswer(questionId: $questionId, answerId: $answerId, actorId: $actorId) {
      ${QUESTION_FIELDS}
    }
  }
`;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length ? value : null;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && !Number.isNaN(value) ? value : fallback;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function normalizeQuestion(raw: Record<string, unknown>): Question {
  return {
    id: String(raw['id'] ?? ''),
    autorId: String(raw['autorId'] ?? ''),
    titulo: String(raw['titulo'] ?? ''),
    descripcion: String(raw['descripcion'] ?? ''),
    codigoEjemplo: asString(raw['codigoEjemplo']),
    etiquetas: asStringArray(raw['etiquetas']),
    categoria: asString(raw['categoria']),
    estado: String(raw['estado'] ?? 'ABIERTA'),
    respuestaAceptadaId: asString(raw['respuestaAceptadaId']),
    votosCount: asNumber(raw['votosCount']),
    respuestasCount: asNumber(raw['respuestasCount']),
    vistasCount: asNumber(raw['vistasCount']),
    oculto: asBoolean(raw['oculto']),
    createdAt: asString(raw['createdAt']),
    updatedAt: asString(raw['updatedAt']),
  };
}

function normalizeAnswer(raw: Record<string, unknown>): Answer {
  return {
    id: String(raw['id'] ?? ''),
    questionId: String(raw['questionId'] ?? ''),
    autorId: String(raw['autorId'] ?? ''),
    contenido: String(raw['contenido'] ?? ''),
    codigoEjemplo: asString(raw['codigoEjemplo']),
    votosCount: asNumber(raw['votosCount']),
    aceptada: asBoolean(raw['aceptada']),
    oculto: asBoolean(raw['oculto']),
    createdAt: asString(raw['createdAt']),
    updatedAt: asString(raw['updatedAt']),
  };
}

@Injectable({ providedIn: 'root' })
export class QuestionGraphqlService implements QuestionRepository {
  private readonly apollo = inject(Apollo);

  questions(filters: QuestionFilters, page?: number, size?: number): Observable<Question[]> {
    return this.apollo
      .query<{ questions: Array<Record<string, unknown>> | null }>({
        query: QUESTIONS,
        variables: {
          categoria: filters.categoria ?? null,
          etiqueta: filters.etiqueta ?? null,
          estado: filters.estado ?? null,
          q: filters.q ?? null,
          page: page ?? null,
          size: size ?? null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.questions ?? []).map(normalizeQuestion)));
  }

  question(id: string): Observable<Question | null> {
    return this.apollo
      .query<{ question: Record<string, unknown> | null }>({
        query: QUESTION,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.question ? normalizeQuestion(result.data.question) : null)));
  }

  answers(questionId: string, page?: number, size?: number): Observable<Answer[]> {
    return this.apollo
      .query<{ answers: Array<Record<string, unknown>> | null }>({
        query: ANSWERS,
        variables: { questionId, page: page ?? null, size: size ?? null },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.answers ?? []).map(normalizeAnswer)));
  }

  myQuestions(autorId: string, page?: number, size?: number): Observable<Question[]> {
    return this.apollo
      .query<{ myQuestions: Array<Record<string, unknown>> | null }>({
        query: MY_QUESTIONS,
        variables: { autorId, page: page ?? null, size: size ?? null },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.myQuestions ?? []).map(normalizeQuestion)));
  }

  createQuestion(autorId: string, input: QuestionInput): Observable<Question | null> {
    return this.apollo
      .mutate<{ createQuestion: Record<string, unknown> | null }>({
        mutation: CREATE_QUESTION,
        variables: {
          autorId,
          titulo: input.titulo.trim(),
          descripcion: input.descripcion.trim(),
          codigoEjemplo: input.codigoEjemplo?.trim() ? input.codigoEjemplo.trim() : null,
          etiquetas: input.etiquetas,
          categoria: input.categoria?.trim() ? input.categoria.trim() : null,
        },
      })
      .pipe(
        map((result) => (result.data?.createQuestion ? normalizeQuestion(result.data.createQuestion) : null)),
      );
  }

  updateQuestion(id: string, actorId: string, input: QuestionUpdateInput): Observable<Question | null> {
    return this.apollo
      .mutate<{ updateQuestion: Record<string, unknown> | null }>({
        mutation: UPDATE_QUESTION,
        variables: {
          id,
          actorId,
          titulo: input.titulo ?? null,
          descripcion: input.descripcion ?? null,
          codigoEjemplo: input.codigoEjemplo ?? null,
          etiquetas: input.etiquetas ?? null,
          categoria: input.categoria ?? null,
        },
      })
      .pipe(
        map((result) => (result.data?.updateQuestion ? normalizeQuestion(result.data.updateQuestion) : null)),
      );
  }

  deleteQuestion(id: string, actorId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteQuestion: boolean | null }>({
        mutation: DELETE_QUESTION,
        variables: { id, actorId },
      })
      .pipe(map((result) => !!result.data?.deleteQuestion));
  }

  createAnswer(
    questionId: string,
    autorId: string,
    contenido: string,
    codigoEjemplo?: string,
  ): Observable<Answer | null> {
    return this.apollo
      .mutate<{ createAnswer: Record<string, unknown> | null }>({
        mutation: CREATE_ANSWER,
        variables: {
          questionId,
          autorId,
          contenido: contenido.trim(),
          codigoEjemplo: codigoEjemplo?.trim() ? codigoEjemplo.trim() : null,
        },
      })
      .pipe(
        map((result) => (result.data?.createAnswer ? normalizeAnswer(result.data.createAnswer) : null)),
      );
  }

  updateAnswer(
    id: string,
    actorId: string,
    contenido: string,
    codigoEjemplo?: string,
  ): Observable<Answer | null> {
    return this.apollo
      .mutate<{ updateAnswer: Record<string, unknown> | null }>({
        mutation: UPDATE_ANSWER,
        variables: {
          id,
          actorId,
          contenido: contenido.trim(),
          // El backend solo cambia el código si llega distinto de null; el
          // string vacío permite borrarlo al editar.
          codigoEjemplo: codigoEjemplo ?? null,
        },
      })
      .pipe(
        map((result) => (result.data?.updateAnswer ? normalizeAnswer(result.data.updateAnswer) : null)),
      );
  }

  deleteAnswer(id: string, actorId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteAnswer: boolean | null }>({
        mutation: DELETE_ANSWER,
        variables: { id, actorId },
      })
      .pipe(map((result) => !!result.data?.deleteAnswer));
  }

  voteQuestion(questionId: string, userId: string, valor: number): Observable<boolean> {
    return this.apollo
      .mutate<{ voteQuestion: boolean | null }>({
        mutation: VOTE_QUESTION,
        variables: { questionId, userId, valor },
      })
      .pipe(map((result) => !!result.data?.voteQuestion));
  }

  voteAnswer(answerId: string, userId: string, valor: number): Observable<boolean> {
    return this.apollo
      .mutate<{ voteAnswer: boolean | null }>({
        mutation: VOTE_ANSWER,
        variables: { answerId, userId, valor },
      })
      .pipe(map((result) => !!result.data?.voteAnswer));
  }

  acceptAnswer(questionId: string, answerId: string, actorId: string): Observable<Question | null> {
    return this.apollo
      .mutate<{ acceptAnswer: Record<string, unknown> | null }>({
        mutation: ACCEPT_ANSWER,
        variables: { questionId, answerId, actorId },
      })
      .pipe(
        map((result) => (result.data?.acceptAnswer ? normalizeQuestion(result.data.acceptAnswer) : null)),
      );
  }
}
