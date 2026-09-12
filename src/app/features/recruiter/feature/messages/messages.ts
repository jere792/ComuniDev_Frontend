import { Component } from '@angular/core';

@Component({
  selector: 'app-recruiter-messages',
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class RecruiterMessages {
  conversations = [
    {
      id: 1,
      user: { name: 'Ana Garcia', avatar: 'https://i.pravatar.cc/150?img=1' },
      lastMessage: 'Hola, me interesa la oferta de Frontend',
      time: '10:30 AM',
      unread: 2,
    },
    {
      id: 2,
      user: { name: 'Carlos Lopez', avatar: 'https://i.pravatar.cc/150?img=3' },
      lastMessage: 'Gracias por la oportunidad',
      time: 'Ayer',
      unread: 0,
    },
    {
      id: 3,
      user: { name: 'Maria Rodriguez', avatar: 'https://i.pravatar.cc/150?img=5' },
      lastMessage: '¿Cuándo sería la entrevista?',
      time: 'Lun',
      unread: 1,
    },
  ];

  selectedConversation: any = null;

  selectConversation(conversation: any): void {
    this.selectedConversation = conversation;
  }
}
