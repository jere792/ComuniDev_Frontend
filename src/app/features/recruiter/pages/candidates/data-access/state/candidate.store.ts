import { Injectable, signal, inject } from '@angular/core';
import { Observable, forkJoin, map, tap } from 'rxjs';
import {
  DeveloperProfile,
  SavedProfile,
  TalentSearchFilters,
  TalentSearchResult,
} from '@features/recruiter/pages/candidates/domain/models/developer-profile.model';
import {
  TALENT_SEARCH_REPOSITORY,
  TalentSearchRepository,
} from '@features/recruiter/pages/candidates/domain/ports/talent-search.repository';

@Injectable({ providedIn: 'root' })
export class CandidateStore {
  private readonly repository = inject<TalentSearchRepository>(TALENT_SEARCH_REPOSITORY);

  readonly candidates = signal<DeveloperProfile[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly total = signal(0);
  readonly savedIds = signal<ReadonlySet<string>>(new Set<string>());
  readonly filters = signal<TalentSearchFilters>({ page: 0, size: 20 });

  loadCandidates(recruiterId: string | null, filters: TalentSearchFilters = {}): void {
    const merged: TalentSearchFilters = { ...this.filters(), ...filters };
    this.filters.set(merged);
    this.loading.set(true);
    this.error.set(null);

    this.repository.searchDevelopers(merged).subscribe({
      next: (result: TalentSearchResult) => {
        this.candidates.set(result.developers);
        this.total.set(result.total);
        this.loading.set(false);
        this.markSavedStates(recruiterId, result.developers);
      },
      error: () => {
        this.error.set('Error al buscar candidatos');
        this.loading.set(false);
      },
    });
  }

  private markSavedStates(recruiterId: string | null, developers: DeveloperProfile[]): void {
    if (!recruiterId || developers.length === 0) {
      this.savedIds.set(new Set());
      return;
    }

    forkJoin(
      developers.map(dev =>
        this.repository.isProfileSaved(recruiterId, dev.id).pipe(
          map((saved: boolean): [string, boolean] => [dev.id, saved]),
        ),
      ),
    ).subscribe({
      next: pairs => {
        const ids = new Set<string>();
        for (const [id, saved] of pairs) {
          if (saved) ids.add(id);
        }
        this.savedIds.set(ids);
      },
      error: () => this.savedIds.set(new Set()),
    });
  }

  saveCandidate(recruiterId: string, developerId: string): Observable<SavedProfile> {
    return this.repository.saveDeveloperProfile(recruiterId, developerId).pipe(
      tap(() => {
        const next = new Set(this.savedIds());
        next.add(developerId);
        this.savedIds.set(next);
      }),
    );
  }

  unsaveCandidate(recruiterId: string, developerId: string): Observable<boolean> {
    return this.repository.unsaveDeveloperProfile(recruiterId, developerId).pipe(
      tap(() => {
        const next = new Set(this.savedIds());
        next.delete(developerId);
        this.savedIds.set(next);
      }),
    );
  }

  isSaved(developerId: string): boolean {
    return this.savedIds().has(developerId);
  }

  clear(): void {
    this.candidates.set([]);
    this.total.set(0);
    this.savedIds.set(new Set());
    this.error.set(null);
  }
}
