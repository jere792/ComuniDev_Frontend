import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SavedStore, SavedCandidateItem, SavedReelItem } from '@features/recruiter/pages/saved/data-access/state/saved.store';
import { SavedCard } from '@features/recruiter/ui/saved-card/saved-card';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-recruiter-saved',
  imports: [SavedCard, RouterLink],
  templateUrl: './saved.html',
  styleUrl: './saved.scss',
})
export class RecruiterSaved implements OnInit {
  private readonly store = inject(SavedStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = this.store.loading;
  readonly reelsLoading = this.store.reelsLoading;
  readonly error = this.store.error;

  activeTab: 'all' | 'candidates' | 'reels' = 'candidates';

  ngOnInit(): void {
    const userId = this.getRecruiterId();
    if (!userId) {
      this.store.error.set('No se identificó al reclutador');
      return;
    }
    this.store.loadSaved(userId);
  }

  get items(): SavedCandidateItem[] {
    return this.store.items();
  }

  get reels(): SavedReelItem[] {
    return this.store.reels();
  }

  /** Cambia de pestaña y, si hace falta, carga los reels guardados. */
  selectTab(tab: 'candidates' | 'reels'): void {
    this.activeTab = tab;

    if (tab === 'reels' && this.store.reels().length === 0 && !this.reelsLoading()) {
      const userId = this.getRecruiterId();
      if (userId) this.store.loadSavedReels(userId);
    }
  }

  viewProfile(item: SavedCandidateItem): void {
    if (!item.developerId) return;
    this.router.navigate(['/profile', item.developerId]);
  }

  goToAuthor(reel: SavedReelItem): void {
    if (!reel.autorId) return;
    this.router.navigate(['/profile', reel.autorId]);
  }

  remove(item: SavedCandidateItem): void {
    const userId = this.getRecruiterId();
    if (!userId) {
      this.toast.error('No se identificó al reclutador');
      return;
    }

    this.store.remove(userId, item);
    this.toast.success('Perfil quitado de guardados');
  }

  removeReel(item: SavedReelItem): void {
    const userId = this.getRecruiterId();
    if (!userId) {
      this.toast.error('No se identificó al reclutador');
      return;
    }

    this.store.removeReel(userId, item);
    this.toast.success('Reel quitado de guardados');
  }

  private getRecruiterId(): string | null {
    return localStorage.getItem('userId');
  }

  trackById(_index: number, item: SavedCandidateItem | SavedReelItem): string {
    return item.id;
  }
}
