import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Challenge,
  ChallengeSubmission,
} from '@features/developer/retos/domain/models/challenge.model';

export interface ChallengeRepository {
  /** Reto del día: fecha exacta o rotación; sin revelar la respuesta si aún no respondió. */
  dailyChallenge(fecha: string | null, userId: string | null): Observable<Challenge | null>;
  /** Respuesta ya enviada por el usuario; null si aún no respondió. */
  myChallengeSubmission(challengeId: string, userId: string): Observable<ChallengeSubmission | null>;
  /** Respuestas del usuario, más recientes primero. */
  challengeHistory(userId: string, page?: number, size?: number): Observable<ChallengeSubmission[]>;
  /** Una sola respuesta por (challengeId, userId); la segunda llamada devuelve la guardada. */
  submitChallengeAnswer(
    userId: string,
    challengeId: string,
    respuesta: number | null,
    codigo: string | null,
  ): Observable<ChallengeSubmission | null>;
}

export const CHALLENGE_REPOSITORY = new InjectionToken<ChallengeRepository>('ChallengeRepository');
