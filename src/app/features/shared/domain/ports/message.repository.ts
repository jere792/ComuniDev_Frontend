import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Message, MessageConversation } from '@features/shared/domain/models/message.model';

export interface MessageRepository {
  conversations(userId: string): Observable<MessageConversation[]>;
  messages(userId: string, conversationId: string): Observable<Message[]>;
  sendMessage(emisorId: string, receptorId: string, texto: string): Observable<Message | null>;
  markConversationRead(userId: string, conversationId: string): Observable<boolean>;
  /** Suscripcion al canal de tiempo real de esa persona. */
  messageReceived(userId: string): Observable<Message>;
}

export const MESSAGE_REPOSITORY = new InjectionToken<MessageRepository>('MESSAGE_REPOSITORY');
