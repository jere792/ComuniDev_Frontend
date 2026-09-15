import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

export interface ConnectionRequest {
  id: string;
  solicitanteId: string;
  receptorId: string;
  mensaje?: string;
  estado: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  usuarioMenorId: string;
  usuarioMayorId: string;
  iniciadorId: string;
  estado: string;
  createdAt: string;
}

export interface ConnectionStatus {
  status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED';
  requestId?: string;
  connectionId?: string;
}

const GET_CONNECTION_STATUS = gql`
  query ConnectionStatus($userId: String!, $otherUserId: String!) {
    connectionStatus(userId: $userId, otherUserId: $otherUserId) {
      status
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
  mutation RejectConnection($requestId: String!) {
    rejectConnection(requestId: $requestId)
  }
`;

const REMOVE_CONNECTION = gql`
  mutation RemoveConnection($connectionId: String!) {
    removeConnection(connectionId: $connectionId)
  }
`;

@Injectable({ providedIn: 'root' })
export class ConnectionGraphqlService {
  private apollo = inject(Apollo);

  getConnectionStatus(userId: string, otherUserId: string): Observable<ConnectionStatus> {
    return this.apollo
      .watchQuery<any>({
        query: GET_CONNECTION_STATUS,
        variables: { userId, otherUserId },
      })
      .valueChanges.pipe(map((r) => r.data?.connectionStatus ?? { status: 'NONE' }));
  }

  getConnectionRequests(userId: string): Observable<ConnectionRequest[]> {
    return this.apollo
      .watchQuery<any>({
        query: GET_CONNECTION_REQUESTS,
        variables: { userId },
      })
      .valueChanges.pipe(map((r) => r.data?.connectionRequests ?? []));
  }

  getConnections(userId: string): Observable<Connection[]> {
    return this.apollo
      .watchQuery<any>({
        query: GET_CONNECTIONS,
        variables: { userId },
      })
      .valueChanges.pipe(map((r) => r.data?.connections ?? []));
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

  rejectConnection(requestId: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({
        mutation: REJECT_CONNECTION,
        variables: { requestId },
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
