import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, Observable } from 'rxjs';
import { Message, MessageConversation } from '@features/shared/domain/models/message.model';
import { MessageRepository } from '@features/shared/domain/ports/message.repository';

const CONVERSATIONS = gql`
  query Conversations($userId: String!) {
    conversations(userId: $userId) {
      id
      participantes
      otroUserId
      ultimoMensajeTexto
      ultimoMensajeEmisorId
      ultimoMensajeEn
      mensajesNoLeidos
      createdAt
      updatedAt
    }
  }
`;

const MESSAGES = gql`
  query Messages($userId: String!, $conversationId: String!) {
    messages(userId: $userId, conversationId: $conversationId) {
      id
      conversationId
      emisorId
      texto
      leido
      createdAt
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($emisorId: String!, $receptorId: String!, $texto: String!) {
    sendMessage(emisorId: $emisorId, receptorId: $receptorId, texto: $texto) {
      id
      conversationId
      emisorId
      texto
      leido
      createdAt
    }
  }
`;

const MARK_READ = gql`
  mutation MarkConversationRead($userId: String!, $conversationId: String!) {
    markConversationRead(userId: $userId, conversationId: $conversationId)
  }
`;

const MESSAGE_RECEIVED = gql`
  subscription MessageReceived($userId: String!) {
    messageReceived(userId: $userId) {
      id
      conversationId
      emisorId
      texto
      leido
      createdAt
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class MessageGraphqlService implements MessageRepository {
  private apollo = inject(Apollo);

  conversations(userId: string): Observable<MessageConversation[]> {
    return this.apollo
      .query<{ conversations: Array<Record<string, unknown>> | null }>({
        query: CONVERSATIONS,
        variables: { userId },
        fetchPolicy: 'network-only',
      })
      .pipe(map(result => (result.data?.conversations ?? []).map(normalizeConversation)));
  }

  messages(userId: string, conversationId: string): Observable<Message[]> {
    return this.apollo
      .query<{ messages: Array<Record<string, unknown>> | null }>({
        query: MESSAGES,
        variables: { userId, conversationId },
        fetchPolicy: 'network-only',
      })
      .pipe(map(result => (result.data?.messages ?? []).map(normalizeMessage)));
  }

  sendMessage(emisorId: string, receptorId: string, texto: string): Observable<Message | null> {
    return this.apollo
      .mutate<{ sendMessage: Record<string, unknown> | null }>({
        mutation: SEND_MESSAGE,
        variables: { emisorId, receptorId, texto },
      })
      .pipe(map(result => (result.data?.sendMessage ? normalizeMessage(result.data.sendMessage) : null)));
  }

  markConversationRead(userId: string, conversationId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ markConversationRead: boolean | null }>({
        mutation: MARK_READ,
        variables: { userId, conversationId },
      })
      .pipe(map(result => result.data?.markConversationRead === true));
  }

  messageReceived(userId: string): Observable<Message> {
    return this.apollo
      .subscribe<{ messageReceived: Record<string, unknown> | null }>({
        query: MESSAGE_RECEIVED,
        variables: { userId },
      })
      .pipe(
        map(result => result.data?.messageReceived),
        filter((message): message is Record<string, unknown> => message != null),
        map(normalizeMessage),
      );
  }
}

function normalizeConversation(raw: Record<string, unknown>): MessageConversation {
  return {
    id: asString(raw['id']) ?? '',
    participantes: Array.isArray(raw['participantes']) ? (raw['participantes'] as string[]) : [],
    otroUserId: asString(raw['otroUserId']),
    ultimoMensajeTexto: asString(raw['ultimoMensajeTexto']),
    ultimoMensajeEmisorId: asString(raw['ultimoMensajeEmisorId']),
    ultimoMensajeEn: asString(raw['ultimoMensajeEn']),
    mensajesNoLeidos: typeof raw['mensajesNoLeidos'] === 'number' ? (raw['mensajesNoLeidos'] as number) : 0,
    createdAt: asString(raw['createdAt']),
    updatedAt: asString(raw['updatedAt']),
  };
}

function normalizeMessage(raw: Record<string, unknown>): Message {
  return {
    id: asString(raw['id']) ?? '',
    conversationId: asString(raw['conversationId']) ?? '',
    emisorId: asString(raw['emisorId']) ?? '',
    texto: asString(raw['texto']) ?? '',
    leido: raw['leido'] === true,
    createdAt: asString(raw['createdAt']),
  };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
