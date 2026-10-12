import { Injectable, signal, inject } from '@angular/core';
import { first, forkJoin, map, of, switchMap } from 'rxjs';
import { User } from '@core/domain/models/user.model';
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
  /** true si el candidato tiene disponibilidadLaboral.buscandoEmpleo */
  buscandoEmpleo: boolean;
  /** Ciudad/pais · seguidores · conexiones */
  meta: string;
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
              // first() de seguridad: emite una sola vez y cierra, para que
              // forkJoin complete cuando todos los perfiles respondan.
              first(),
              map(user => this.toItem(profile, user)),
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

  private toItem(profile: SavedProfile, user: User | null): SavedCandidateItem {
    const role = (user?.roles?.[0] ?? '').toLowerCase();
    const roleLabel =
      role === 'recruiter'
        ? 'Reclutador'
        : role === 'moderator'
          ? 'Moderador'
          : role === 'admin'
            ? 'Admin'
            : 'Desarrollador';

    // Cargo real del perfil de desarrollador; si no existe, el rol generico.
    const cargo = user?.developerProfile?.tituloProfesional?.trim();
    const subtitle = cargo && cargo.length > 0 ? cargo : roleLabel;

    return {
      id: profile.id,
      developerId: profile.developerId,
      title: user?.nombre || profile.developerId,
      subtitle,
      // '' = sin foto; la tarjeta muestra iniciales (mismo patrón que candidate-card).
      avatar: user?.fotoPerfilUrl ?? '',
      savedAt: formatRelativeDate(profile.savedAt),
      notes: profile.notes ?? null,
      buscandoEmpleo: user?.developerProfile?.disponibilidadLaboral?.buscandoEmpleo ?? false,
      meta: buildMeta(user),
    };
  }
}

/** "Lima, Perú · 120 seguidores · 45 conexiones" (omite lo que falte). */
function buildMeta(user: User | null): string {
  if (!user) return '';

  const ubicacion = [user.ubicacion?.ciudad, user.ubicacion?.pais]
    .map(part => part?.trim())
    .filter((part): part is string => !!part)
    .join(', ');

  const parts = [
    ubicacion,
    user.seguidoresCount != null ? `${user.seguidoresCount} seguidores` : '',
    user.conexionesCount != null ? `${user.conexionesCount} conexiones` : '',
  ].filter(part => part.length > 0);

  return parts.join(' · ');
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
