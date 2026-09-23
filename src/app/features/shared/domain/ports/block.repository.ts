import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface BlockRepository {
  isBlocked(bloqueadorId: string, bloqueadoId: string): Observable<boolean>;
  block(bloqueadorId: string, bloqueadoId: string): Observable<unknown>;
  unblock(bloqueadorId: string, bloqueadoId: string): Observable<boolean>;
}

export const BLOCK_REPOSITORY = new InjectionToken<BlockRepository>('BlockRepository');
