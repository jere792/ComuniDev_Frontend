import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import {
  CertificadoResponse,
  CvResponse,
  DeveloperProfile,
  DisponibilidadLaboral,
  EducacionResponse,
  EnlacesResponse,
  ExperienciaResponse,
  ProyectoResponse,
  SavedProfile,
  TalentSearchFilters,
  TalentSearchResult,
  TecnologiaResponse,
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
  const asArray = <T>(value: unknown): T[] | null => (Array.isArray(value) ? (value as T[]) : null);
  const asString = (value: unknown): string | null => (typeof value === 'string' && value.length ? value : null);
  const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);
  const asBool = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null);
  const asObject = <T>(value: unknown): T | null => (value && typeof value === 'object' ? (value as T) : null);

  return {
    id: String(id),
    nombre: String(raw['nombre'] ?? raw['nombreUsuario'] ?? 'Sin nombre'),
    nombreUsuario: asString(raw['nombreUsuario']),
    email: asString(raw['email']),
    telefono: asString(raw['telefono']),
    fotoPerfilUrl: asString(raw['fotoPerfilUrl']),
    bannerUrl: asString(raw['bannerUrl']),
    bio: asString(raw['bio']),
    sitioWeb: asString(raw['sitioWeb']),
    ubicacionPais: asString(raw['ubicacionPais']),
    ubicacionDepartamento: asString(raw['ubicacionDepartamento']),
    ubicacionCiudad: asString(raw['ubicacionCiudad']),
    estadoCuenta: asString(raw['estadoCuenta']),
    createdAt: asString(raw['createdAt']),
    seguidoresCount: asNumber(raw['seguidoresCount']),
    siguiendoCount: asNumber(raw['siguiendoCount']),
    conexionesCount: asNumber(raw['conexionesCount']),
    tituloProfesional: asString(raw['tituloProfesional']),
    tecnologias: asArray<TecnologiaResponse>(raw['tecnologias']),
    habilidadesBlandas: asArray<string>(raw['habilidadesBlandas']),
    experiencias: asArray<ExperienciaResponse>(raw['experiencias']),
    educacion: asArray<EducacionResponse>(raw['educacion']),
    certificados: asArray<CertificadoResponse>(raw['certificados']),
    proyectos: asArray<ProyectoResponse>(raw['proyectos']),
    cv: asObject<CvResponse>(raw['cv']),
    enlaces: asObject<EnlacesResponse>(raw['enlaces']),
    disponibilidadLaboral: asObject<DisponibilidadLaboral>(raw['disponibilidadLaboral']),
    remoto: asBool(raw['remoto']),
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
      .query<{ isProfileSaved: boolean }>({
        query: IS_PROFILE_SAVED,
        variables: { recruiterId, developerId },
        fetchPolicy: 'network-only',
      })
      .pipe(map(result => result.data?.isProfileSaved ?? false));
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
