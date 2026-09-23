import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Connection, ConnectionRequest, ConnectionStatus } from '@features/shared/domain/models/connection.model';

export interface ConnectionRepository {
  getConnectionStatus(userId: string, otherUserId: string): Observable<ConnectionStatus>;
  getConnectionRequests(userId: string): Observable<ConnectionRequest[]>;
  getConnections(userId: string): Observable<Connection[]>;
  sendRequest(solicitanteId: string, receptorId: string, mensaje?: string): Observable<ConnectionRequest | null>;
  acceptConnection(requestId: string): Observable<Connection | null>;
  rejectConnection(requestId: string): Observable<boolean>;
  removeConnection(connectionId: string): Observable<boolean>;
}

export const CONNECTION_REPOSITORY = new InjectionToken<ConnectionRepository>('ConnectionRepository');
