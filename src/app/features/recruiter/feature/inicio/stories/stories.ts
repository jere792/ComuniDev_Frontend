import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { StoryGraphqlService, SocialStory } from '../../../../../core/services/social/story-graphql.service';
import { GraphQLService } from '../../../../../core/services/graphql.service';

interface StoryUser {
  autorId: string;
  nombre: string;
  avatar: string;
  stories: SocialStory[];
}

@Component({
  selector: 'app-stories',
  imports: [FormsModule, DatePipe],
  templateUrl: './stories.html',
  styleUrl: './stories.scss',
})
export class StoriesComponent implements OnInit {
  private storyService = inject(StoryGraphqlService);
  private graphql = inject(GraphQLService);
  private router = inject(Router);

  storyUsers = signal<StoryUser[]>([]);
  showComposer = signal(false);
  storyImage: string | null = null;
  storyText = '';
  uploading = false;
  creating = false;

  // Viewer
  viewingUser = signal<StoryUser | null>(null);
  viewingIndex = signal(0);

  private userCache = new Map<string, { nombre: string; avatar: string }>();

  private getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  ngOnInit(): void {
    this.loadStories();
  }

  private loadStories(): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.storyService.getStories(userId).subscribe({
      next: (data: SocialStory[]) => {
        const grouped = this.groupByAutor(data);
        this.storyUsers.set(grouped);
        grouped.forEach(g => this.loadUserNames(g));
      },
      error: (err) => {
        console.error('Failed to load stories:', err);
      }
    });
  }

  private groupByAutor(stories: SocialStory[]): StoryUser[] {
    const map = new Map<string, SocialStory[]>();
    for (const s of stories) {
      const arr = map.get(s.autorId) ?? [];
      arr.push(s);
      map.set(s.autorId, arr);
    }
    return Array.from(map.entries()).map(([autorId, userStories]) => ({
      autorId,
      nombre: '',
      avatar: '',
      stories: userStories.sort((a, b) =>
        new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      ),
    }));
  }

  private loadUserNames(group: StoryUser): void {
    if (this.userCache.has(group.autorId)) {
      const info = this.userCache.get(group.autorId)!;
      group.nombre = info.nombre;
      group.avatar = info.avatar;
      this.storyUsers.update(u => [...u]);
      return;
    }

    this.graphql.getUser(group.autorId).subscribe({
      next: (user: any) => {
        if (user) {
          const info = { nombre: user.nombre ?? 'Usuario', avatar: user.fotoPerfilUrl ?? '' };
          this.userCache.set(group.autorId, info);
          group.nombre = info.nombre;
          group.avatar = info.avatar;
          this.storyUsers.update(u => [...u]);
        }
      },
      error: () => {}
    });
  }

  // ─── Composer ───

  toggleComposer(): void {
    this.showComposer.update(v => !v);
    if (!this.showComposer()) {
      this.storyImage = null;
      this.storyText = '';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.graphql.uploadFile(file).subscribe({
      next: (res: any) => {
        this.storyImage = res?.secure_url ?? res?.url ?? null;
        this.uploading = false;
      },
      error: (err) => {
        console.error('Failed to upload image:', err);
        this.uploading = false;
      }
    });
  }

  createStory(): void {
    const userId = this.getUserId();
    if (!userId) return;

    const hasContent = this.storyImage || this.storyText.trim();
    if (!hasContent) return;

    this.creating = true;
    const contenido: any = {};
    if (this.storyImage) contenido.imagenUrl = this.storyImage;
    if (this.storyText.trim()) contenido.texto = this.storyText.trim();

    this.storyService.createStory(userId, contenido).subscribe({
      next: (created: SocialStory) => {
        if (created) {
          this.loadStories();
          this.toggleComposer();
        }
        this.creating = false;
      },
      error: (err) => {
        console.error('Failed to create story:', err);
        this.creating = false;
      }
    });
  }

  // ─── Viewer ───

  openStory(user: StoryUser): void {
    this.viewingUser.set(user);
    this.viewingIndex.set(0);
  }

  closeViewer(): void {
    this.viewingUser.set(null);
    this.viewingIndex.set(0);
  }

  nextStory(): void {
    const user = this.viewingUser();
    if (!user) return;
    if (this.viewingIndex() < user.stories.length - 1) {
      this.viewingIndex.update(i => i + 1);
    } else {
      // Go to next user or close
      const users = this.storyUsers();
      const currentIdx = users.indexOf(user);
      if (currentIdx < users.length - 1) {
        this.viewingUser.set(users[currentIdx + 1]);
        this.viewingIndex.set(0);
      } else {
        this.closeViewer();
      }
    }
  }

  prevStory(): void {
    const user = this.viewingUser();
    if (!user) return;
    if (this.viewingIndex() > 0) {
      this.viewingIndex.update(i => i - 1);
    } else {
      const users = this.storyUsers();
      const currentIdx = users.indexOf(user);
      if (currentIdx > 0) {
        this.viewingUser.set(users[currentIdx - 1]);
        const prev = users[currentIdx - 1];
        this.viewingIndex.set(prev.stories.length - 1);
      }
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  goToProfile(autorId: string): void {
    this.router.navigate(['/profile', autorId]);
  }
}
