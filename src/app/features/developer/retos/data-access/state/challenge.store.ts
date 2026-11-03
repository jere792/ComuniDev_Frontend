import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  Challenge,
  ChallengeSubmission,
} from '@features/developer/retos/domain/models/challenge.model';
import {
  CHALLENGE_REPOSITORY,
  ChallengeRepository,
} from '@features/developer/retos/domain/ports/challenge.repository';

/**
 * Estado del reto diario: el reto del día, la respuesta ya enviada (si la
 * hay), el resultado del envío y el histórico. El backend oculta
 * respuestaCorrecta/solucionReferencia hasta responder: aquí solo se
 * guardan tal cual llegan, nunca se inventan.
 */
@Injectable({ providedIn: 'root' })
export class ChallengeStore {
  private repository = inject<ChallengeRepository>(CHALLENGE_REPOSITORY);

  readonly challenge = signal<Challenge | null>(null);
  readonly submission = signal<ChallengeSubmission | null>(null);
  readonly history = signal<ChallengeSubmission[]>([]);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  /** Carga el reto del día (fecha = hoy si viene null) y, si ya respondió, su respuesta. */
  load(fecha: string | null = null, userId: string | null = null): void {
    this.loading.set(true);
    this.error.set(null);
    this.submission.set(null);

    this.repository.dailyChallenge(fecha, userId).subscribe({
      next: (challenge) => {
        this.challenge.set(challenge);
        this.loading.set(false);
        if (!challenge) {
          this.error.set('Todavía no hay un reto disponible');
          return;
        }
        if (userId) this.cargarSubmission(challenge.id, userId);
      },
      error: () => {
        this.error.set('No se pudo cargar el reto del día');
        this.loading.set(false);
      },
    });
  }

  private cargarSubmission(challengeId: string, userId: string): void {
    this.repository.myChallengeSubmission(challengeId, userId).subscribe({
      next: (submission) => this.submission.set(submission),
      error: () => this.submission.set(null),
    });
  }

  /** Envía la respuesta; el resultado reemplaza el formulario en pantalla. */
  submit(userId: string, challengeId: string, respuesta: number | null, codigo: string | null): Observable<ChallengeSubmission | null> {
    if (this.submitting()) return new Observable<ChallengeSubmission | null>();
    this.submitting.set(true);
    return this.repository.submitChallengeAnswer(userId, challengeId, respuesta, codigo).pipe(
      tap({
        next: (submission) => {
          this.submission.set(submission);
          this.submitting.set(false);
          // el reto ya respondido trae solución y explicación visibles
          if (submission?.challenge) this.challenge.set(submission.challenge);
          if (submission) this.history.update((actual) => [submission, ...actual.filter((h) => h.id !== submission.id)]);
        },
        error: () => this.submitting.set(false),
      }),
    );
  }

  loadHistory(userId: string, page = 0, size = 10): void {
    if (!userId) return;
    this.repository.challengeHistory(userId, page, size).subscribe({
      next: (history) => this.history.set(history),
      error: () => this.history.set([]),
    });
  }

  clear(): void {
    this.challenge.set(null);
    this.submission.set(null);
    this.history.set([]);
    this.error.set(null);
  }
}
