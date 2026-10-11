import { Component, Input, OnChanges, Output, EventEmitter, SimpleChanges, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';
import { StoryCategory } from '@features/recruiter/pages/profile/domain/models/story-category.model';
import { CategoryStore } from '@features/recruiter/pages/profile/data-access/state/category.store';
import { StoryStore } from '@features/recruiter/pages/inicio/data-access/state/story.store';
import { SocialStory } from '@features/recruiter/pages/inicio/domain/models/social-story.model';

const COLOR_PRESETS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777', '#4f46e5'];

@Component({
  selector: 'app-story-classification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './story-classification.html',
  styleUrls: ['./story-classification.scss'],
})
export class StoryClassification implements OnChanges {
  @Input() userId = '';
  @Input() open = false;
  @Input() initialCategoryId: string | null = null;
  @Input() openInCreate = false;
  @Input() editCategoryId: string | null = null;
  @Output() close = new EventEmitter<void>();

  private categoryStore = inject(CategoryStore);
  private storyStore = inject(StoryStore);
  private toast = inject(ToastService);

  readonly colorPresets = COLOR_PRESETS;

  selected = signal<string>('all');
  showForm = signal(false);
  editingId = signal<string | null>(null);
  confirmDeleteId = signal<string | null>(null);
  formNombre = signal('');
  formColor = signal(COLOR_PRESETS[0]);
  saving = signal(false);
  selectedIds = signal<string[]>([]);
  assignTarget = signal('');

  categories = this.categoryStore.categories;
  stories = this.storyStore.userStories;
  loading = computed(() => this.categoryStore.loading() || this.storyStore.loadingUserStories());

  counts = computed(() => {
    const map: Record<string, number> = { all: this.stories().length, none: 0 };
    for (const story of this.stories()) {
      const ids = story.categoriaIds ?? [];
      if (ids.length === 0) map['none']++;
      for (const id of ids) map[id] = (map[id] ?? 0) + 1;
    }
    return map;
  });

  filtered = computed(() => {
    const sel = this.selected();
    const stories = this.stories();
    if (sel === 'all') return stories;
    if (sel === 'none') return stories.filter(s => !s.categoriaIds?.length);
    return stories.filter(s => s.categoriaIds?.includes(sel));
  });

  selectedCategory = computed<StoryCategory | null>(() => {
    const sel = this.selected();
    if (sel === 'all' || sel === 'none') return null;
    return this.categories().find(c => c.id === sel) ?? null;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      if (this.userId) {
        this.categoryStore.load(this.userId);
        this.storyStore.loadUserStories(this.userId);
      }
      this.applyOpenConfig();
    }
  }

  private applyOpenConfig(): void {
    this.confirmDeleteId.set(null);
    this.selectedIds.set([]);
    this.showForm.set(false);
    this.editingId.set(null);

    if (this.editCategoryId) {
      const cat = this.categories().find(c => c.id === this.editCategoryId);
      if (cat) {
        this.select(cat.id);
        this.startEdit(cat);
        return;
      }
    }
    if (this.openInCreate) {
      this.startCreate();
      return;
    }
    if (this.initialCategoryId) {
      this.select(this.initialCategoryId);
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModal();
  }

  closeModal(): void {
    this.close.emit();
  }

  select(value: string): void {
    this.selected.set(value);
    this.selectedIds.set([]);
    this.confirmDeleteId.set(null);
    if (value !== 'all' && value !== 'none') this.assignTarget.set(value);
  }

  startCreate(): void {
    this.editingId.set(null);
    this.formNombre.set('');
    this.formColor.set(COLOR_PRESETS[0]);
    this.showForm.set(true);
  }

  startEdit(category: StoryCategory): void {
    this.editingId.set(category.id);
    this.formNombre.set(category.nombre);
    this.formColor.set(category.color || COLOR_PRESETS[0]);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  saveForm(): void {
    const nombre = this.formNombre().trim();
    if (!nombre || !this.userId || this.saving()) return;

    this.saving.set(true);
    const request = this.editingId()
      ? this.categoryStore.update(this.editingId()!, { nombre, color: this.formColor() })
      : this.categoryStore.create({ userId: this.userId, nombre, color: this.formColor() });

    request.subscribe({
      next: () => {
        this.categoryStore.load(this.userId);
        this.toast.success(this.editingId() ? 'Categoría actualizada' : 'Categoría creada');
        this.saving.set(false);
        this.cancelForm();
      },
      error: () => {
        this.toast.error('Error al guardar la categoría');
        this.saving.set(false);
      },
    });
  }

  requestDelete(category: StoryCategory): void {
    if (this.confirmDeleteId() !== category.id) {
      this.confirmDeleteId.set(category.id);
      return;
    }
    this.confirmDeleteId.set(null);
    this.categoryStore.delete(category.id).subscribe({
      next: () => {
        this.categoryStore.load(this.userId);
        this.storyStore.loadUserStories(this.userId);
        if (this.selected() === category.id) this.selected.set('all');
        this.toast.success('Categoría eliminada');
      },
      error: () => this.toast.error('Error al eliminar la categoría'),
    });
  }

  toggleStory(id: string): void {
    this.selectedIds.update(ids => (ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]));
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  assignSelected(): void {
    const target = this.assignTarget();
    if (!target) return;
    this.updateSelected(story => {
      const current = story.categoriaIds ?? [];
      return current.includes(target) ? current : [...current, target];
    }, 'Historias asignadas a la categoría');
  }

  removeFromCategory(): void {
    const catId = this.selected();
    if (catId === 'all' || catId === 'none') return;
    this.updateSelected(story => (story.categoriaIds ?? []).filter(id => id !== catId), 'Historias quitadas de la categoría');
  }

  private updateSelected(mapper: (story: SocialStory) => string[], successMessage: string): void {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const calls = ids
      .map(id => this.stories().find(s => s.id === id))
      .filter((s): s is SocialStory => !!s)
      .map(story => this.storyStore.updateCategorias(story.id, mapper(story)));

    if (calls.length === 0) return;

    let pending = calls.length;
    calls.forEach(call =>
      call.subscribe({
        next: () => {
          pending--;
          if (pending === 0) this.finishUpdate(successMessage);
        },
        error: () => {
          pending--;
          if (pending === 0) this.finishUpdate(successMessage);
        },
      })
    );
  }

  private finishUpdate(successMessage: string): void {
    this.storyStore.loadUserStories(this.userId);
    this.selectedIds.set([]);
    this.toast.success(successMessage);
  }

  categoryById(id: string): StoryCategory | undefined {
    return this.categories().find(c => c.id === id);
  }

  formatDate(iso?: string): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
  }
}
