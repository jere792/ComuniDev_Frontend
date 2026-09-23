import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import {
  DeveloperProfile,
  SavedProfile,
  TalentSearchFilters,
  TalentSearchResult,
} from '@features/recruiter/pages/candidates/domain/models/developer-profile.model';
import {
  TalentSearchRepository,
} from '@features/recruiter/pages/candidates/domain/ports/talent-search.repository';

const SAVE_DEVELOPER_PROFILE = gql`
  mutation SaveDeveloperProfile($recruiterId: String!, $developerId: String!, $notes: String) {
    saveDeveloperProfile(recruiterId: $recruiterId, developerId: $developerId, notes: $notes) {
      id
      recruiterId
      developerId
      notes
      savedAt
    }
  }
`;

const UNSAVE_DEVELOPER_PROFILE = gql`
  mutation UnsaveDeveloperProfile($recruiterId: String!, $developerId: String!) {
    unsaveDeveloperProfile(recruiterId: $recruiterId, developerId: $developerId)
  }
`;

const IS_PROFILE_SAVED = gql`
  query IsProfileSaved($recruiterId: String!, $developerId: String!) {
    isProfileSaved(recruiterId: $recruiterId, developerId: $developerId)
  }
`;

const SAVED_PROFILES = gql`
  query SavedProfiles($recruiterId: String!) {
    savedProfiles(recruiterId: $recruiterId) {
      id
      recruiterId
      developerId
      notes
      savedAt
    }
  }
`;

function normalizeDeveloper(raw: Record<string, unknown>, index: number): DeveloperProfile {
  const id = raw['id'] ?? raw['_id'] ?? raw['nombreUsuario'] ?? `dev-${index}`;
  const tecnologias = Array.isArray(raw['tecnologias']) ? raw['tecnologias'] : [];
  const habilidades = Array.isArray(raw['habilidadesBlandas']) ? raw['habilidadesBlandas'] : [];
  const disponibilidad = (raw['disponibilidadLaboral'] ?? null) as DeveloperProfile['disponibilidadLaboral'];
  const experiencias = Array.isArray(raw['experiencias']) ? raw['experiencias'] : [];

  return {
    id: String(id),
    nombre: String(raw['nombre'] ?? raw['nombreUsuario'] ?? 'Sin nombre'),
    nombreUsuario: (raw['nombreUsuario'] as string | null | undefined) ?? null,
    fotoPerfilUrl: (raw['fotoPerfilUrl'] as string | null | undefined) ?? null,
    tituloProfesional: (raw['tituloProfesional'] as string | null | undefined) ?? null,
    bio: (raw['bio'] as string | null | undefined) ?? null,
    ubicacionPais: (raw['ubicacionPais'] as string | null | undefined) ?? null,
    ubicacionCiudad: (raw['ubicacionCiudad'] as string | null | undefined) ?? null,
    tecnologias,
    habilidadesBlandas: habilidades as string[],
    disponibilidadLaboral: disponibilidad,
    remoto: (raw['remoto'] as boolean | null | undefined) ?? null,
    experiencias,
  };
}

function normalizeResult(payload: unknown): TalentSearchResult {
  if (Array.isArray(payload)) {
    const developers = payload.map((item, i) => normalizeDeveloper(item as Record<string, unknown>, i));
    return { developers, total: developers.length, page: 0, size: developers.length || 20 };
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const list = Array.isArray(obj['developers']) ? (obj['developers'] as Record<string, unknown>[]) : [];
    const developers = list.map((item, i) => normalizeDeveloper(item, i));
    return {
      developers,
      total: typeof obj['total'] === 'number' ? obj['total'] : developers.length,
      page: typeof obj['page'] === 'number' ? obj['page'] : 0,
      size: typeof obj['size'] === 'number' ? obj['size'] : developers.length || 20,
    };
  }

  return { developers: [], total: 0, page: 0, size: 20 };
}

@Injectable({ providedIn: 'root' })
export class TalentSearchService implements TalentSearchRepository {
  private readonly apollo = inject(Apollo);
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/talent-search`;

  searchDevelopers(filters: TalentSearchFilters): Observable<TalentSearchResult> {
    return this.http
      .post<unknown>(`${this.base}/search`, filters)
      .pipe(
        map(response => {
          const data = (response as { data?: unknown })?.data ?? response;
          return normalizeResult(data);
        }),
      );
  }

  saveDeveloperProfile(recruiterId: string, developerId: string, notes?: string): Observable<SavedProfile> {
    return this.apollo
      .mutate<{ saveDeveloperProfile: SavedProfile | null }>({
        mutation: SAVE_DEVELOPER_PROFILE,
        variables: { recruiterId, developerId, notes: notes ?? null },
      })
      .pipe(
        map(result => {
          const saved = result.data?.saveDeveloperProfile;
          if (!saved) {
            throw new Error('No se pudo guardar el perfil');
          }
          return saved;
        }),
      );
  }

  unsaveDeveloperProfile(recruiterId: string, developerId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ unsaveDeveloperProfile: boolean }>({
        mutation: UNSAVE_DEVELOPER_PROFILE,
        variables: { recruiterId, developerId },
      })
      .pipe(map(result => result.data?.unsaveDeveloperProfile ?? false));
  }

  isProfileSaved(recruiterId: string, developerId: string): Observable<boolean> {
    return this.apollo
      .watchQuery<{ isProfileSaved: boolean }>({
        query: IS_PROFILE_SAVED,
        variables: { recruiterId, developerId },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map(result => result.data?.isProfileSaved ?? false));
  }

  savedProfiles(recruiterId: string): Observable<SavedProfile[]> {
    return this.apollo
      .watchQuery<{ savedProfiles: Array<Record<string, unknown>> | null }>({
        query: SAVED_PROFILES,
        variables: { recruiterId },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(
        map(result => {
          const list = result.data?.savedProfiles ?? [];
          return list.map((raw, index) => ({
            id: String(raw['id'] ?? raw['_id'] ?? index),
            recruiterId: String(raw['recruiterId'] ?? recruiterId),
            developerId: String(raw['developerId'] ?? ''),
            notes: (raw['notes'] as string | null | undefined) ?? null,
            savedAt: (raw['savedAt'] as string | null | undefined) ?? null,
          }));
        }),
      );
  }
}
