export interface NotificationReferencia {
  tipo?: string;
  id?: string;
}

export interface AppNotification {
  id: string;
  destinatarioId: string;
  actorId?: string;
  /** Nombre y foto del actor, resueltos al crear la notificacion en el backend. */
  actorNombre?: string;
  actorFoto?: string;
  tipo: string;
  titulo: string;
  mensaje?: string;
  /** Detalle extra: p. ej. el tipo de reaccion (LIKE, LOVE...). */
  detalle?: string;
  referencia?: NotificationReferencia;
  leida: boolean;
  createdAt: string;
}
