import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BlockGraphqlService {
  private apollo = inject(Apollo);

  isBlocked(bloqueadorId: string, bloqueadoId: string) {
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

  block(bloqueadorId: string, bloqueadoId: string) {
    return this.apollo
      .mutate<{ block: any }>({
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

  unblock(bloqueadorId: string, bloqueadoId: string) {
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
