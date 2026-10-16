import { Injectable, inject, signal } from '@angular/core';
import { Message, MessageConversation } from '@features/shared/domain/models/message.model';
import { MESSAGE_REPOSITORY, MessageRepository } from '@features/shared/domain/ports/message.repository';

@Injectable({ providedIn: 'root' })
export class MessageStore {
  private repository = inject<MessageRepository>(MESSAGE_REPOSITORY);

  readonly conversaciones = signal<MessageConversation[]>([]);
  readonly mensajes = signal<Message[]>([]);
  readonly abierta = signal<MessageConversation | null>(null);
  readonly cargandoConversaciones = signal(false);
  readonly cargandoMensajes = signal(false);
  readonly enviando = signal(false);

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

  abrir(conversation: MessageConversation, userId: string): void {
    this.userId = userId;
    this.abierta.set(conversation);
    this.mensajes.set([]);
    this.cargandoMensajes.set(true);

    this.repository.messages(userId, conversation.id).subscribe({
      next: lista => {
        this.mensajes.set(lista);
        this.cargandoMensajes.set(false);
      },
      error: () => this.cargandoMensajes.set(false),
    });

    if (conversation.mensajesNoLeidos) {
      this.marcarLeido(userId, conversation.id);
    }
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
    if (abierta && esElHiloAbierto(abierta, message)) {
      this.mensajes.update(lista => sinDuplicados([...lista, message]));
      // El hilo recién creado todavía no traía id; ahora ya lo sabemos.
      if (!abierta.id) this.abierta.set({ ...abierta, id: message.conversationId });
    }

    const indice = this.conversaciones().findIndex(c => c.id === message.conversationId);
    if (indice < 0) {
      // Hilo recien creado: no hay nada que mover, se vuelve a pedir la lista.
      this.cargarConversaciones(userId);
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
 */
function esElHiloAbierto(abierta: MessageConversation | null, message: Message): boolean {
  if (!abierta) return false;
  if (abierta.id) return abierta.id === message.conversationId;
  return abierta.otroUserId != null && abierta.otroUserId === message.emisorId;
}
