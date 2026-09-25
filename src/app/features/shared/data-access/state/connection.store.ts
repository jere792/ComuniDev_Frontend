import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Connection, ConnectionRequest, ConnectionStatus } from '@features/shared/domain/models/connection.model';
import { CONNECTION_REPOSITORY, ConnectionRepository } from '@features/shared/domain/ports/connection.repository';

@Injectable({ providedIn: 'root' })
export class ConnectionStore {
  private repository = inject<ConnectionRepository>(CONNECTION_REPOSITORY);

  readonly status = signal<ConnectionStatus | null>(null);
  readonly requests = signal<ConnectionRequest[]>([]);
  readonly connections = signal<Connection[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  getConnectionStatus(userId: string, otherUserId: string): Observable<ConnectionStatus> {
    return this.repository.getConnectionStatus(userId, otherUserId);
  }

  subscribeToConnectionStatus(userId: string): Observable<ConnectionStatus> {
    return this.repository.subscribeToConnectionStatus(userId);
  }

  loadRequests(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getConnectionRequests(userId).subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar solicitudes');
        this.loading.set(false);
      },
    });
  }

  loadConnections(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.getConnections(userId).subscribe({
      next: (connections) => {
        this.connections.set(connections);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar conexiones');
        this.loading.set(false);
      },
    });
  }

  getConnectionRequests(userId: string): Observable<ConnectionRequest[]> {
    return this.repository.getConnectionRequests(userId);
  }

  getConnections(userId: string): Observable<Connection[]> {
    return this.repository.getConnections(userId);
  }

  sendRequest(solicitanteId: string, receptorId: string, mensaje?: string): Observable<ConnectionRequest | null> {
    return this.repository.sendRequest(solicitanteId, receptorId, mensaje);
  }

  acceptConnection(requestId: string): Observable<Connection | null> {
    return this.repository.acceptConnection(requestId);
  }

  rejectConnection(requestId: string, actorId?: string): Observable<boolean> {
    return this.repository.rejectConnection(requestId, actorId);
  }

  removeConnection(connectionId: string): Observable<boolean> {
    return this.repository.removeConnection(connectionId);
  }

  clear(): void {
    this.status.set(null);
    this.requests.set([]);
    this.connections.set([]);
    this.error.set(null);
  }
}
