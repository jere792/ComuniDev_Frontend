/** Hilo de mensajes entre dos personas (schema `MessageConversation`). */
export interface MessageConversation {
  id: string;
  participantes: string[];
  /** El otro participante, visto desde el usuario que consulta. */
  otroUserId: string | null;
  ultimoMensajeTexto: string | null;
  ultimoMensajeEmisorId: string | null;
  ultimoMensajeEn: string | null;
  /** No leidos que quedan para el usuario que consulta. */
  mensajesNoLeidos: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** True si para el usuario que consulta el hilo esta pendiente de aceptar. */
  esSolicitud: boolean;
}

/** Un mensaje suelto dentro de un hilo (schema `Message`). */
export interface Message {
  id: string;
  conversationId: string;
  emisorId: string;
  texto: string;
  leido: boolean;
  createdAt: string | null;
}
