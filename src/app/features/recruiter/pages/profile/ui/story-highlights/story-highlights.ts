import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { StoryViewerUser } from '@shared/ui/story-viewer/story-viewer';
import { StoryCategory } from '@features/recruiter/pages/profile/domain/models/story-category.model';
import { CategoryStore } from '@features/recruiter/pages/profile/data-access/state/category.store';
import { StoryStore } from '@features/recruiter/pages/inicio/data-access/state/story.store';

export interface HighlightManageRequest {
  category: StoryCategory | null;
  mode: 'create' | 'edit' | 'manage';
}

@Component({
  selector: 'app-story-highlights',
  standalone: true,
  imports: [CommonModule, ConfirmModal],
  templateUrl: './story-highlights.html',
  styleUrl: './story-highlights.scss',
})
export class StoryHighlights implements OnChanges {
  @Input() userId = '';
  @Output() view = new EventEmitter<StoryViewerUser>();
  @Output() create = new EventEmitter<void>();
  @Output() manage = new EventEmitter<HighlightManageRequest>();

  private categoryStore = inject(CategoryStore);
  private storyStore = inject(StoryStore);
  private toast = inject(ToastService);

  categories = this.categoryStore.categories;
  stories = this.storyStore.userStories;

  menuFor = signal<string | null>(null);
  menuPos = signal<{ x: number; y: number } | null>(null);
  confirmDeleteId = signal<string | null>(null);
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTriggered = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && this.userId) {
      this.categoryStore.load(this.userId);
      this.storyStore.loadUserStories(this.userId);
    }
  }

  get hasCategories(): boolean {
    return this.categories().length > 0;
  }

  storiesOf(categoryId: string): number {
    return this.stories().filter(s => s.categoriaIds?.includes(categoryId)).length;
  }

  getInitial(name: string): string {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  // ─── Tap: abrir visor ───

  onCircleClick(category: StoryCategory): void {
    if (this.longPressTriggered) {
      this.longPressTriggered = false;
      return;
    }
    const catStories = this.stories().filter(s => s.categoriaIds?.includes(category.id));
    if (catStories.length === 0) {
      this.toast.info('Esta categoría no tiene historias');
      return;
    }
    this.view.emit({
      autorId: this.userId,
      nombre: category.nombre,
      avatar: '',
      stories: catStories,
    });
  }

  onCreateClick(): void {
    if (this.longPressTriggered) {
      this.longPressTriggered = false;
      return;
    }
    this.create.emit();
  }

  // ─── Long-press: menú ───

  onPointerDown(category: StoryCategory, event: Event): void {
    event.preventDefault();
    this.longPressTriggered = false;
    const el = event.currentTarget as HTMLElement | null;
    const rect = el?.getBoundingClientRect();
    this.pressTimer = setTimeout(() => {
      this.longPressTriggered = true;
      if (rect) {
        const x = Math.min(Math.max(rect.left + rect.width / 2, 100), window.innerWidth - 100);
        this.menuPos.set({ x, y: rect.bottom + 6 });
      }
      this.menuFor.set(category.id);
    }, 500);
  }

  onPointerUp(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  closeMenu(): void {
    this.menuFor.set(null);
    this.menuPos.set(null);
    this.confirmDeleteId.set(null);
  }

  onEdit(category: StoryCategory): void {
    this.closeMenu();
    this.manage.emit({ category, mode: 'edit' });
  }

  onManage(category: StoryCategory): void {
    this.closeMenu();
    this.manage.emit({ category, mode: 'manage' });
  }

  // ─── Eliminar ───

  onDelete(category: StoryCategory): void {
    if (this.confirmDeleteId() !== category.id) {
      this.closeMenu();
      this.confirmDeleteId.set(category.id);
      return;
    }
    this.confirmDeleteId.set(null);
    this.closeMenu();
    this.categoryStore.delete(category.id).subscribe({
      next: () => {
        this.categoryStore.load(this.userId);
        this.storyStore.loadUserStories(this.userId);
        this.toast.success('Categoría eliminada');
      },
      error: () => this.toast.error('Error al eliminar la categoría'),
    });
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    const category = this.categories().find(c => c.id === id);
    if (category) this.onDelete(category);
  }

  onConfirmOverlayClose(): void {
    this.confirmDeleteId.set(null);
  }
}
