import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, Observable } from 'rxjs';
import { Connection, ConnectionRequest, ConnectionStatus } from '@features/shared/domain/models/connection.model';
import { ConnectionRepository } from '@features/shared/domain/ports/connection.repository';

const GET_CONNECTION_STATUS = gql`
  query ConnectionStatus($userId: String!, $otherUserId: String!) {
    connectionStatus(userId: $userId, otherUserId: $otherUserId) {
      status
      userId
      otherUserId
      requestId
      connectionId
    }
  }
`;

const GET_CONNECTION_REQUESTS = gql`
  query ConnectionRequests($userId: String!) {
    connectionRequests(userId: $userId) {
      id
      solicitanteId
      receptorId
      mensaje
      estado
      createdAt
    }
  }
`;

const GET_CONNECTIONS = gql`
  query Connections($userId: String!) {
    connections(userId: $userId) {
      id
      usuarioMenorId
      usuarioMayorId
      iniciadorId
      estado
      createdAt
    }
  }
`;

const SEND_REQUEST = gql`
  mutation SendConnectionRequest($solicitanteId: String!, $receptorId: String!, $mensaje: String) {
    sendConnectionRequest(solicitanteId: $solicitanteId, receptorId: $receptorId, mensaje: $mensaje) {
      id
      solicitanteId
      receptorId
      estado
      createdAt
    }
  }
`;

const ACCEPT_CONNECTION = gql`
  mutation AcceptConnection($requestId: String!) {
    acceptConnection(requestId: $requestId) {
      id
      usuarioMenorId
      usuarioMayorId
      estado
    }
  }
`;

const REJECT_CONNECTION = gql`
  mutation RejectConnection($requestId: String!, $actorId: String) {
    rejectConnection(requestId: $requestId, actorId: $actorId)
  }
`;

const REMOVE_CONNECTION = gql`
  mutation RemoveConnection($connectionId: String!) {
    removeConnection(connectionId: $connectionId)
  }
`;

const SUBSCRIBE_CONNECTION_STATUS = gql`
  subscription ConnectionStatusChanged($userId: String!) {
    connectionStatusChanged(userId: $userId) {
      status
      userId
      otherUserId
      requestId
      connectionId
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class ConnectionGraphqlService implements ConnectionRepository {
  private apollo = inject(Apollo);

  getConnectionStatus(userId: string, otherUserId: string): Observable<ConnectionStatus> {
    return this.apollo
      .query<any>({
        query: GET_CONNECTION_STATUS,
        variables: { userId, otherUserId },
        fetchPolicy: 'network-only',
      })
      .pipe(map((r) => r.data?.connectionStatus ?? { status: 'NONE' }));
  }

  getConnectionRequests(userId: string): Observable<ConnectionRequest[]> {
    return this.apollo
      .query<any>({
        query: GET_CONNECTION_REQUESTS,
        variables: { userId },
        fetchPolicy: 'network-only',
      })
      .pipe(map((r) => r.data?.connectionRequests ?? []));
  }

  getConnections(userId: string): Observable<Connection[]> {
    return this.apollo
      .query<any>({
        query: GET_CONNECTIONS,
        variables: { userId },
        fetchPolicy: 'network-only',
      })
      .pipe(map((r) => r.data?.connections ?? []));
  }

  subscribeToConnectionStatus(userId: string): Observable<ConnectionStatus> {
    return this.apollo
      .subscribe<{ connectionStatusChanged: ConnectionStatus | null }>({
        query: SUBSCRIBE_CONNECTION_STATUS,
        variables: { userId },
      })
      .pipe(
        map((r) => r.data?.connectionStatusChanged),
        filter((s): s is ConnectionStatus => s != null),
      );
  }

  sendRequest(solicitanteId: string, receptorId: string, mensaje?: string): Observable<ConnectionRequest | null> {
    return this.apollo
      .mutate<any>({
        mutation: SEND_REQUEST,
        variables: { solicitanteId, receptorId, mensaje },
      })
      .pipe(map((r) => r.data?.sendConnectionRequest ?? null));
  }

  acceptConnection(requestId: string): Observable<Connection | null> {
    return this.apollo
      .mutate<any>({
        mutation: ACCEPT_CONNECTION,
        variables: { requestId },
      })
      .pipe(map((r) => r.data?.acceptConnection ?? null));
  }

  rejectConnection(requestId: string, actorId?: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({
        mutation: REJECT_CONNECTION,
        variables: { requestId, actorId },
      })
      .pipe(map((r) => r.data?.rejectConnection ?? false));
  }

  removeConnection(connectionId: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({
        mutation: REMOVE_CONNECTION,
        variables: { connectionId },
      })
      .pipe(map((r) => r.data?.removeConnection ?? false));
  }
}
