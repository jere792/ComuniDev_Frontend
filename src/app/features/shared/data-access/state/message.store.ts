import { Injectable, inject, signal } from '@angular/core';
import { Message, MessageConversation } from '@features/shared/domain/models/message.model';
import { MESSAGE_REPOSITORY, MessageRepository } from '@features/shared/domain/ports/message.repository';

@Injectable({ providedIn: 'root' })
export class MessageStore {
  private repository = inject<MessageRepository>(MESSAGE_REPOSITORY);

  readonly conversaciones = signal<MessageConversation[]>([]);
  readonly solicitudes = signal<MessageConversation[]>([]);
  readonly mensajes = signal<Message[]>([]);
  readonly abierta = signal<MessageConversation | null>(null);
  readonly cargandoConversaciones = signal(false);
  readonly cargandoSolicitudes = signal(false);
  readonly cargandoMensajes = signal(false);
  readonly enviando = signal(false);
  /** Todavia hay mensajes mas viejos que no se cargaron del servidor. */
  readonly hayMasMensajes = signal(false);
  readonly cargandoMasMensajes = signal(false);

  /** Ventana que se pide al servidor al abrir un hilo y por cada "cargar mas". */
  private static readonly TAMANO_VENTANA = 30;

  /** Quien está usando la pantalla; el backend no lo dice porque no hay JWT. */
  private userId: string | null = null;

  cargarConversaciones(userId: string): void {
    this.userId = userId;
    this.cargandoConversaciones.set(true);
    this.repository.conversations(userId).subscribe({
      next: lista => {
        this.conversaciones.set(lista);
        this.cargandoConversaciones.set(false);
      },
      error: () => this.cargandoConversaciones.set(false),
    });
  }

  /** Los hilos de alguien que todavía no sigo: quedan ocultos hasta aceptarlos. */
  cargarSolicitudes(userId: string): void {
    this.userId = userId;
    this.cargandoSolicitudes.set(true);
    this.repository.messageRequests(userId).subscribe({
      next: lista => {
        this.solicitudes.set(lista);
        this.cargandoSolicitudes.set(false);
      },
      error: () => this.cargandoSolicitudes.set(false),
    });
  }

  /** Pasa una solicitud a conversacion normal y la deja visible en la lista. */
  aceptar(conversation: MessageConversation, userId: string): void {
    this.repository.acceptConversation(userId, conversation.id).subscribe({
      next: ok => {
        if (!ok) return;
        this.solicitudes.update(lista => lista.filter(c => c.id !== conversation.id));
        this.conversaciones.update(lista => [
          { ...conversation, esSolicitud: false },
          ...lista.filter(c => c.id !== conversation.id),
        ]);
      },
    });
  }

  /** Saca la solicitud de la vista de quien la rechaza; el otro sigue viendola. */
  rechazar(conversation: MessageConversation, userId: string): void {
    this.repository.rejectConversation(userId, conversation.id).subscribe({
      next: ok => {
        if (!ok) return;
        this.solicitudes.update(lista => lista.filter(c => c.id !== conversation.id));
      },
    });
  }

  abrir(conversation: MessageConversation, userId: string): void {
    this.userId = userId;
    this.abierta.set(conversation);
    this.mensajes.set([]);
    this.hayMasMensajes.set(false);
    this.cargandoMensajes.set(true);

    this.repository.messages(userId, conversation.id, MessageStore.TAMANO_VENTANA).subscribe({
      next: lista => {
        this.mensajes.set(lista);
        this.hayMasMensajes.set(lista.length >= MessageStore.TAMANO_VENTANA);
        this.cargandoMensajes.set(false);
      },
      error: () => this.cargandoMensajes.set(false),
    });

    if (conversation.mensajesNoLeidos) {
      this.marcarLeido(userId, conversation.id);
    }
  }

  /** Trae la ventana anterior (hacia atras en el tiempo) y la prepende al hilo. */
  cargarMasMensajes(): void {
    const conversation = this.abierta();
    const userId = this.userId;
    const masViejo = this.mensajes()[0]?.createdAt;
    if (!conversation?.id || !userId || !masViejo || this.cargandoMasMensajes()) return;

    this.cargandoMasMensajes.set(true);
    this.repository.messages(userId, conversation.id, MessageStore.TAMANO_VENTANA, masViejo).subscribe({
      next: lista => {
        this.mensajes.update(actual => sinDuplicados([...lista, ...actual]));
        this.hayMasMensajes.set(lista.length >= MessageStore.TAMANO_VENTANA);
        this.cargandoMasMensajes.set(false);
      },
      error: () => this.cargandoMasMensajes.set(false),
    });
  }

  /** Abre un hilo que todavía no está en la lista, para escribirle a alguien nuevo. */
  abrirCon(userId: string, otroUserId: string): void {
    const existente = this.conversaciones().find(c => c.otroUserId === otroUserId);
    if (existente) {
      this.abrir(existente, userId);
      return;
    }

    const nueva: MessageConversation = {
      id: '',
      participantes: [userId, otroUserId],
      otroUserId,
      ultimoMensajeTexto: null,
      ultimoMensajeEmisorId: null,
      ultimoMensajeEn: null,
      mensajesNoLeidos: 0,
      createdAt: null,
      updatedAt: null,
      esSolicitud: false,
    };
    this.abierta.set(nueva);
    this.mensajes.set([]);
  }

  cerrar(): void {
    this.abierta.set(null);
    this.mensajes.set([]);
  }

  /** Se engancha al canal de tiempo real y aplica todo lo que llegue. */
  escuchar(userId: string, alCambiar?: () => void): void {
    this.userId = userId;
    this.repository.messageReceived(userId).subscribe({
      next: message => {
        this.aplicarLlegada(message, userId);
        alCambiar?.();
      },
    });
  }

  enviar(emisorId: string, receptorId: string, texto: string): void {
    this.userId = emisorId;
    this.enviando.set(true);
    this.repository.sendMessage(emisorId, receptorId, texto).subscribe({
      next: mensaje => {
        this.enviando.set(false);
        // La suscripcion tambien lo trae; aplicarLlegada quita el duplicado.
        if (mensaje) this.aplicarLlegada(mensaje, emisorId);
      },
      error: () => this.enviando.set(false),
    });
  }

  /**
   * Aplica un mensaje que acaba de llegar, venga de la mutacion o del canal de
   * tiempo real: entra al hilo si esta abierto y empuja esa conversacion al tope
   * de la lista con su no leido al dia.
   */
  aplicarLlegada(message: Message, userId: string): void {
    this.userId = userId;

    const abierta = this.abierta();
    if (abierta && esElHiloAbierto(abierta, message, userId)) {
      this.mensajes.update(lista => sinDuplicados([...lista, message]));
      // El hilo recién creado todavía no traía id; ahora ya lo sabemos.
      if (!abierta.id) this.abierta.set({ ...abierta, id: message.conversationId });
    }

    const indice = this.conversaciones().findIndex(c => c.id === message.conversationId);
    if (indice < 0) {
      // Puede ser un hilo recien creado, o una solicitud que recien llega.
      const indiceSolicitud = this.solicitudes().findIndex(c => c.id === message.conversationId);
      if (indiceSolicitud >= 0) {
        const solicitud = this.solicitudes()[indiceSolicitud];
        const actualizada: MessageConversation = {
          ...solicitud,
          ultimoMensajeTexto: message.texto,
          ultimoMensajeEmisorId: message.emisorId,
          ultimoMensajeEn: message.createdAt ?? solicitud.ultimoMensajeEn,
          mensajesNoLeidos: message.emisorId === userId ? 0 : (solicitud.mensajesNoLeidos ?? 0) + 1,
        };
        this.solicitudes.set([
          actualizada,
          ...this.solicitudes().filter(c => c.id !== solicitud.id),
        ]);
        return;
      }
      // Hilo recien creado: no hay nada que mover, se vuelven a pedir las listas.
      this.cargarConversaciones(userId);
      this.cargarSolicitudes(userId);
      return;
    }

    const actual = this.conversaciones()[indice];
    const esMio = message.emisorId === userId;
    const visible = abierta != null && abierta.id === message.conversationId;

    const actualizada: MessageConversation = {
      ...actual,
      ultimoMensajeTexto: message.texto,
      ultimoMensajeEmisorId: message.emisorId,
      ultimoMensajeEn: message.createdAt ?? actual.ultimoMensajeEn,
      mensajesNoLeidos: esMio || visible ? 0 : (actual.mensajesNoLeidos ?? 0) + 1,
    };

    this.conversaciones.set([actualizada, ...this.conversaciones().filter(c => c.id !== actual.id)]);
  }

  private marcarLeido(userId: string, conversationId: string): void {
    this.repository.markConversationRead(userId, conversationId).subscribe();
    this.conversaciones.update(lista =>
      lista.map(c => (c.id === conversationId ? { ...c, mensajesNoLeidos: 0 } : c)));
  }
}

/** El backend avisa por dos caminos y el mismo mensaje puede llegar dos veces. */
function sinDuplicados(lista: Message[]): Message[] {
  const vistos = new Set<string>();
  return lista.filter(message => {
    if (vistos.has(message.id)) return false;
    vistos.add(message.id);
    return true;
  });
}

/**
 * El hilo abierto coincide con el mensaje si traen el mismo id, o si el abierto
 * todavía no tiene id porque se acaba de crear escribiendo el primer mensaje.
 * En ese caso coincide tanto un mensaje propio (recién salido de este chat) como
 * uno de la persona a la que se le escribía.
 */
function esElHiloAbierto(
  abierta: MessageConversation | null,
  message: Message,
  userId: string,
): boolean {
  if (!abierta) return false;
  if (abierta.id) return abierta.id === message.conversationId;
  if (message.emisorId === userId) return true;
  return abierta.otroUserId != null && abierta.otroUserId === message.emisorId;
}
