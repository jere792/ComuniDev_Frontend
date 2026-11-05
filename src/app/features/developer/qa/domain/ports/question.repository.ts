import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Answer,
  Question,
  QuestionFilters,
  QuestionInput,
  QuestionUpdateInput,
} from '@features/developer/qa/domain/models/question.model';

export interface QuestionRepository {
  /** Listado público con filtros opcionales; por fecha descendente. */
  questions(filters: QuestionFilters, page?: number, size?: number): Observable<Question[]>;

  /** Detalle de una pregunta; el backend suma una vista. */
  question(id: string): Observable<Question | null>;

  /** Respuestas visibles, las más votadas primero. */
  answers(questionId: string, page?: number, size?: number): Observable<Answer[]>;

  /** Preguntas publicadas por un autor. */
  myQuestions(autorId: string, page?: number, size?: number): Observable<Question[]>;

  createQuestion(autorId: string, input: QuestionInput): Observable<Question | null>;

  updateQuestion(id: string, actorId: string, input: QuestionUpdateInput): Observable<Question | null>;

  deleteQuestion(id: string, actorId: string): Observable<boolean>;

  createAnswer(
    questionId: string,
    autorId: string,
    contenido: string,
    codigoEjemplo?: string,
  ): Observable<Answer | null>;

  updateAnswer(
    id: string,
    actorId: string,
    contenido: string,
    codigoEjemplo?: string,
  ): Observable<Answer | null>;

  deleteAnswer(id: string, actorId: string): Observable<boolean>;

  /** Voto +1/-1 sobre una pregunta (el autor no puede votar la suya). */
  voteQuestion(questionId: string, userId: string, valor: number): Observable<boolean>;

  /** Voto +1/-1 sobre una respuesta (el autor no puede votar la suya). */
  voteAnswer(answerId: string, userId: string, valor: number): Observable<boolean>;

  acceptAnswer(questionId: string, answerId: string, actorId: string): Observable<Question | null>;
}

export const QUESTION_REPOSITORY = new InjectionToken<QuestionRepository>('QuestionRepository');
