import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialReaction, TipoReaccion } from '@features/shared/domain/models/social-reaction.model';
import { REACTION_REPOSITORY, ReactionRepository } from '@features/shared/domain/ports/reaction.repository';

@Injectable({ providedIn: 'root' })
export class ReactionStore {
  private repository = inject<ReactionRepository>(REACTION_REPOSITORY);

  readonly reactions = signal<SocialReaction[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  getReactions(targetId: string, targetType: string): Observable<SocialReaction[]> {
    return this.repository.getReactions(targetId, targetType);
  }

  getMyReaction(userId: string, targetId: string, targetType: string): Observable<SocialReaction | null> {
    return this.repository.getMyReaction(userId, targetId, targetType);
  }

  react(
    usuarioId: string,
    objetivoId: string,
    tipoObjetivo: string,
    tipoReaccion: TipoReaccion
  ): Observable<SocialReaction> {
    return this.repository.react(usuarioId, objetivoId, tipoObjetivo, tipoReaccion);
  }

  unreact(usuarioId: string, objetivoId: string, tipoObjetivo: string): Observable<boolean> {
    return this.repository.unreact(usuarioId, objetivoId, tipoObjetivo);
  }

  clear(): void {
    this.reactions.set([]);
    this.error.set(null);
  }
}
