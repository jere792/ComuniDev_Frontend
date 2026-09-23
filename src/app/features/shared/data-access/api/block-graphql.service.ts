import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { BlockRepository } from '@features/shared/domain/ports/block.repository';

@Injectable({ providedIn: 'root' })
export class BlockGraphqlService implements BlockRepository {
  private apollo = inject(Apollo);

  isBlocked(bloqueadorId: string, bloqueadoId: string): Observable<boolean> {
    return this.apollo
      .watchQuery<{ isBlocked: boolean }>({
        query: gql`
          query IsBlocked($bloqueadorId: String!, $bloqueadoId: String!) {
            isBlocked(bloqueadorId: $bloqueadorId, bloqueadoId: $bloqueadoId)
          }
        `,
        variables: { bloqueadorId, bloqueadoId },
      })
      .valueChanges.pipe(map((result) => result.data?.isBlocked ?? false));
  }

  block(bloqueadorId: string, bloqueadoId: string): Observable<unknown> {
    return this.apollo
      .mutate<{ block: unknown }>({
        mutation: gql`
          mutation Block($bloqueadorId: String!, $bloqueadoId: String!) {
            block(bloqueadorId: $bloqueadorId, bloqueadoId: $bloqueadoId) {
              id
            }
          }
        `,
        variables: { bloqueadorId, bloqueadoId },
      })
      .pipe(map((result) => result.data?.block));
  }

  unblock(bloqueadorId: string, bloqueadoId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ unblock: boolean }>({
        mutation: gql`
          mutation Unblock($bloqueadorId: String!, $bloqueadoId: String!) {
            unblock(bloqueadorId: $bloqueadorId, bloqueadoId: $bloqueadoId)
          }
        `,
        variables: { bloqueadorId, bloqueadoId },
      })
      .pipe(map((result) => result.data?.unblock ?? false));
  }
}
