import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface Reaction {
  type: 'like' | 'love' | 'comment';
  count: number;
  reacted: boolean;
}

export interface Comment {
  id: number;
  user: { name: string; avatar: string };
  text: string;
  time: string;
  liked: boolean;
  likes: number;
}

@Component({
  selector: 'app-report-card',
  standalone: true,
  templateUrl: './report-card.html',
  styleUrl: './report-card.scss',
})
export class ReportCard {
  @Input() id = 0;
  @Input() userName = '';
  @Input() userAvatar = '';
  @Input() time = '';
  @Input() content = '';
  @Input() image = '';
  @Input() reactions: Reaction[] = [];
  @Input() comments: Comment[] = [];
  @Input() isOwn = false;
  @Output() toggleReaction = new EventEmitter<{ reportId: number; type: string }>();
  @Output() addComment = new EventEmitter<{ reportId: number; text: string }>();
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
}
