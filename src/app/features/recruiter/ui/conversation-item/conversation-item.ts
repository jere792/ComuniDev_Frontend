import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  templateUrl: './conversation-item.html',
  styleUrl: './conversation-item.scss',
})
export class ConversationItem {
  @Input() id = 0;
  @Input() name = '';
  @Input() avatar = '';
  @Input() lastMessage = '';
  @Input() time = '';
  @Input() unread = 0;
  @Input() active = false;
  @Output() select = new EventEmitter<number>();
}
