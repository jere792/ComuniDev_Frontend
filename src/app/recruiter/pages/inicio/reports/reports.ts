import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Comment {
  id: number;
  user: { name: string; avatar: string };
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  isOwn: boolean;
  showReplies: boolean;
  replies: Comment[];
  showReplyInput: boolean;
  replyText: string;
}

interface Report {
  id: number;
  user: { name: string; avatar: string };
  content: string;
  image?: string;
  time: string;
  reactions: { type: string; count: number; reacted: boolean }[];
  comments: Comment[];
  isOwn: boolean;
  isEditing: boolean;
  editText: string;
  showComments: boolean;
}

@Component({
  selector: 'app-reports',
  imports: [FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsComponent {
  reports: Report[] = [
    {
      id: 1,
      user: { name: 'Tu', avatar: 'https://i.pravatar.cc/150?img=12' },
      content: 'Buscamos Frontend Developer con experiencia en Angular y React. ¡Aplica ahora!',
      time: 'Hace 2 horas',
      reactions: [
        { type: 'like', count: 12, reacted: false },
        { type: 'love', count: 5, reacted: true },
        { type: 'comment', count: 3, reacted: false },
      ],
      comments: [
        {
          id: 1,
          user: { name: 'Ana Garcia', avatar: 'https://i.pravatar.cc/150?img=1' },
          text: 'Me interesa, ¿cuáles son los requisitos?',
          time: 'Hace 1 hora',
          likes: 2,
          liked: false,
          isOwn: false,
          showReplies: false,
          showReplyInput: false,
          replyText: '',
          replies: [
            {
              id: 11,
              user: { name: 'Tu', avatar: 'https://i.pravatar.cc/150?img=12' },
              text: '3+ años de experiencia, conocimientos en TypeScript',
              time: 'Hace 45 min',
              likes: 1,
              liked: false,
              isOwn: true,
              showReplies: false,
              showReplyInput: false,
              replyText: '',
              replies: [],
            },
          ],
        },
      ],
      isOwn: true,
      isEditing: false,
      editText: '',
      showComments: false,
    },
    {
      id: 2,
      user: { name: 'Carlos Lopez', avatar: 'https://i.pravatar.cc/150?img=3' },
      content: 'Compartiendo mi experiencia trabajando con Docker en producción. ¡Ha sido un viaje increíble!',
      image: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600',
      time: 'Hace 5 horas',
      reactions: [
        { type: 'like', count: 45, reacted: true },
        { type: 'love', count: 18, reacted: false },
        { type: 'comment', count: 8, reacted: false },
      ],
      comments: [
        {
          id: 2,
          user: { name: 'Maria Rodriguez', avatar: 'https://i.pravatar.cc/150?img=5' },
          text: '¡Muy buen artículo! Lo comparto con mi equipo.',
          time: 'Hace 3 horas',
          likes: 5,
          liked: true,
          isOwn: false,
          showReplies: false,
          showReplyInput: false,
          replyText: '',
          replies: [],
        },
      ],
      isOwn: false,
      isEditing: false,
      editText: '',
      showComments: false,
    },
  ];

  toggleReaction(report: Report, reactionType: string): void {
    const reaction = report.reactions.find(r => r.type === reactionType);
    if (reaction) {
      reaction.reacted = !reaction.reacted;
      reaction.count += reaction.reacted ? 1 : -1;
    }
  }

  toggleComments(report: Report): void {
    report.showComments = !report.showComments;
  }

  startEdit(report: Report): void {
    report.isEditing = true;
    report.editText = report.content;
  }

  saveEdit(report: Report): void {
    report.content = report.editText;
    report.isEditing = false;
  }

  cancelEdit(report: Report): void {
    report.isEditing = false;
    report.editText = '';
  }

  deleteReport(report: Report): void {
    this.reports = this.reports.filter(r => r.id !== report.id);
  }

  addComment(report: Report, text: string): void {
    if (text.trim()) {
      report.comments.push({
        id: Date.now(),
        user: { name: 'Tu', avatar: 'https://i.pravatar.cc/150?img=12' },
        text: text.trim(),
        time: 'Ahora',
        likes: 0,
        liked: false,
        isOwn: true,
        showReplies: false,
        showReplyInput: false,
        replyText: '',
        replies: [],
      });
    }
  }

  toggleReply(comment: Comment): void {
    comment.showReplyInput = !comment.showReplyInput;
  }

  addReply(comment: Comment, text: string): void {
    if (text.trim()) {
      comment.replies.push({
        id: Date.now(),
        user: { name: 'Tu', avatar: 'https://i.pravatar.cc/150?img=12' },
        text: text.trim(),
        time: 'Ahora',
        likes: 0,
        liked: false,
        isOwn: true,
        showReplies: false,
        showReplyInput: false,
        replyText: '',
        replies: [],
      });
      comment.showReplyInput = false;
      comment.showReplies = true;
    }
  }

  toggleCommentLike(comment: Comment): void {
    comment.liked = !comment.liked;
    comment.likes += comment.liked ? 1 : -1;
  }
}
