import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import {
  VacancyDetail,
  VacancyDetailRemuneracion,
} from '@features/developer/postulaciones/domain/models/vacancy-detail.model';
import { VacancyDetailRepository } from '@features/developer/postulaciones/domain/ports/vacancy-detail.repository';

const VACANCY_BY_ID = gql`
  query VacancyById($id: ID!) {
    vacancy(id: $id) {
      id
      companyId
      recruiterId
      titulo
      descripcion
      responsabilidades
      requisitos
      tecnologias
      nivelExperiencia
      modalidad
      tipoContrato
      ubicacion
      remuneracion {
        visible
        moneda
        minimo
        maximo
        periodo
      }
      vacantesDisponibles
      estado
      fechaLimite
      destacada
      postulacionesCount
      createdAt
      company {
        nombre
        logoUrl
        sector
      }
    }
  }
`;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length ? value : null;

const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function normalizeRemuneracion(raw: unknown): VacancyDetailRemuneracion | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    visible: typeof r['visible'] === 'boolean' ? r['visible'] : null,
    moneda: asString(r['moneda']),
    minimo: asNumber(r['minimo']),
    maximo: asNumber(r['maximo']),
    periodo: asString(r['periodo']),
  };
}

function normalizeVacancyDetail(raw: Record<string, unknown>): VacancyDetail {
  const companyRaw = raw['company'];
  const company =
    companyRaw && typeof companyRaw === 'object'
      ? {
          nombre: String((companyRaw as Record<string, unknown>)['nombre'] ?? ''),
          logoUrl: asString((companyRaw as Record<string, unknown>)['logoUrl']),
          sector: asString((companyRaw as Record<string, unknown>)['sector']),
        }
      : null;

  return {
    id: String(raw['id'] ?? ''),
    companyId: asString(raw['companyId']),
    recruiterId: asString(raw['recruiterId']),
    titulo: String(raw['titulo'] ?? 'Sin título'),
    descripcion: asString(raw['descripcion']),
    responsabilidades: asStringArray(raw['responsabilidades']),
    requisitos: asStringArray(raw['requisitos']),
    tecnologias: asStringArray(raw['tecnologias']),
    nivelExperiencia: asString(raw['nivelExperiencia']),
    modalidad: asString(raw['modalidad']),
    tipoContrato: asString(raw['tipoContrato']),
    ubicacion: asString(raw['ubicacion']),
    remuneracion: normalizeRemuneracion(raw['remuneracion']),
    vacantesDisponibles: asNumber(raw['vacantesDisponibles']),
    estado: asString(raw['estado']),
    fechaLimite: asString(raw['fechaLimite']),
    destacada: typeof raw['destacada'] === 'boolean' ? raw['destacada'] : null,
    postulacionesCount: asNumber(raw['postulacionesCount']),
    createdAt: asString(raw['createdAt']),
    company,
  };
}

@Injectable({ providedIn: 'root' })
export class VacancyDetailGraphqlService implements VacancyDetailRepository {
  private readonly apollo = inject(Apollo);

  vacancyById(id: string): Observable<VacancyDetail | null> {
    return this.apollo
      .query<{ vacancy: Record<string, unknown> | null }>({
        query: VACANCY_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.vacancy ? normalizeVacancyDetail(result.data.vacancy) : null)));
  }
}
