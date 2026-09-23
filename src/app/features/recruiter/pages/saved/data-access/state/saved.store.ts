import { Injectable, signal, inject } from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { SavedProfile } from '@features/recruiter/pages/candidates/domain/models/developer-profile.model';
import {
  TALENT_SEARCH_REPOSITORY,
  TalentSearchRepository,
} from '@features/recruiter/pages/candidates/domain/ports/talent-search.repository';
import { UserStore } from '@features/users/data-access/state/user.store';

export interface SavedCandidateItem {
  id: string;
  developerId: string;
  title: string;
  subtitle: string;
  avatar: string;
  savedAt: string;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SavedStore {
  private readonly repository = inject<TalentSearchRepository>(TALENT_SEARCH_REPOSITORY);
  private readonly userStore = inject(UserStore);

  readonly items = signal<SavedCandidateItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadSaved(recruiterId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.repository.savedProfiles(recruiterId).pipe(
      switchMap((profiles: SavedProfile[]) => {
        if (profiles.length === 0) {
          return of([] as SavedCandidateItem[]);
        }
        return forkJoin(
          profiles.map(profile =>
            this.userStore.getById(profile.developerId).pipe(
              map(user => this.toItem(profile, user?.nombre, user?.fotoPerfilUrl, user?.roles)),
            ),
          ),
        );
      }),
    ).subscribe({
      next: items => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar guardados');
        this.loading.set(false);
      },
    });
  }

  remove(recruiterId: string, item: SavedCandidateItem): void {
    this.repository.unsaveDeveloperProfile(recruiterId, item.developerId).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== item.id));
      },
      error: () => this.error.set('No se pudo quitar el guardado'),
    });
  }

  private toItem(
    profile: SavedProfile,
    nombre?: string,
    foto?: string,
    roles?: string[],
  ): SavedCandidateItem {
    const role = (roles?.[0] ?? '').toLowerCase();
    const subtitle =
      role === 'recruiter'
        ? 'Reclutador'
        : role === 'moderator'
          ? 'Moderador'
          : role === 'admin'
            ? 'Admin'
            : 'Desarrollador';

    return {
      id: profile.id,
      developerId: profile.developerId,
      title: nombre || profile.developerId,
      subtitle,
      avatar: foto || `https://i.pravatar.cc/150?u=${encodeURIComponent(profile.developerId)}`,
      savedAt: formatRelativeDate(profile.savedAt),
      notes: profile.notes ?? null,
    };
  }
}

function formatRelativeDate(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} semana${weeks === 1 ? '' : 's'}`;

  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}
