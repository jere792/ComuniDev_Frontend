import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SocialReaction, TipoReaccion } from '@features/shared/domain/models/social-reaction.model';

export interface ReactionRepository {
  getReactions(targetId: string, targetType: string): Observable<SocialReaction[]>;
  getMyReaction(userId: string, targetId: string, targetType: string): Observable<SocialReaction | null>;
  react(
    usuarioId: string,
    objetivoId: string,
    tipoObjetivo: string,
    tipoReaccion: TipoReaccion
  ): Observable<SocialReaction>;
  unreact(usuarioId: string, objetivoId: string, tipoObjetivo: string): Observable<boolean>;
}

export const REACTION_REPOSITORY = new InjectionToken<ReactionRepository>('ReactionRepository');
