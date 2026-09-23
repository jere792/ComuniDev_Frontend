import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SavedStore, SavedCandidateItem } from '@features/recruiter/pages/saved/data-access/state/saved.store';
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

  readonly loading = this.store.loading;
  readonly error = this.store.error;

  activeTab: 'all' | 'candidates' | 'reels' = 'candidates';

  ngOnInit(): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) {
      this.store.error.set('No se identificó al reclutador');
      return;
    }
    this.store.loadSaved(recruiterId);
  }

  get items(): SavedCandidateItem[] {
    if (this.activeTab === 'reels') return [];
    return this.store.items();
  }

  remove(item: SavedCandidateItem): void {
    const recruiterId = this.getRecruiterId();
    if (!recruiterId) {
      this.toast.error('No se identificó al reclutador');
      return;
    }

    this.store.remove(recruiterId, item);
    this.toast.success('Perfil quitado de guardados');
  }

  private getRecruiterId(): string | null {
    return localStorage.getItem('userId');
  }

  trackById(_index: number, item: SavedCandidateItem): string {
    return item.id;
  }
}
