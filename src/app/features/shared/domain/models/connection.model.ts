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
  userId?: string;
  otherUserId?: string;
  requestId?: string;
  connectionId?: string;
}
