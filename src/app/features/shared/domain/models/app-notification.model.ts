export interface NotificationReferencia {
  tipo?: string;
  id?: string;
}

export interface AppNotification {
  id: string;
  destinatarioId: string;
  actorId?: string;
  tipo: string;
  titulo: string;
  mensaje?: string;
  referencia?: NotificationReferencia;
  leida: boolean;
  createdAt: string;
}
