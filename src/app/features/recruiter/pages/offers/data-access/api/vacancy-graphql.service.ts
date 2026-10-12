import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, forkJoin, map } from 'rxjs';
import {
  CompanyInput,
  CompanyOption,
  OfferItem,
  Vacancy,
  VacancyInput,
  VacancyRemuneracion,
} from '@features/recruiter/pages/offers/domain/models/vacancy.model';
import { VacancyRepository } from '@features/recruiter/pages/offers/domain/ports/vacancy.repository';

const VACANCIES_BY_RECRUITER = gql`
  query VacanciesByRecruiter($recruiterId: String!) {
    vacanciesByRecruiter(recruiterId: $recruiterId) {
      id
      companyId
      recruiterId
      titulo
      descripcion
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
    }
  }
`;

const COMPANIES = gql`
  query Companies {
    companies {
      id
      nombre
    }
  }
`;

const CREATE_COMPANY = gql`
  mutation CreateCompany($nombre: String!, $contacto: CompanyContactoInput, $ubicacion: CompanyUbicacionInput) {
    createCompany(nombre: $nombre, contacto: $contacto, ubicacion: $ubicacion) {
      id
      nombre
    }
  }
`;

const CREATE_VACANCY = gql`
  mutation CreateVacancy(
    $companyId: String
    $recruiterId: String
    $titulo: String!
    $descripcion: String
    $tecnologias: [String]
    $nivelExperiencia: String
    $modalidad: String
    $tipoContrato: String
    $ubicacion: String
    $remuneracion: VacancyRemuneracionInput
    $fechaLimite: String
  ) {
    createVacancy(
      companyId: $companyId
      recruiterId: $recruiterId
      titulo: $titulo
      descripcion: $descripcion
      tecnologias: $tecnologias
      nivelExperiencia: $nivelExperiencia
      modalidad: $modalidad
      tipoContrato: $tipoContrato
      ubicacion: $ubicacion
      remuneracion: $remuneracion
      fechaLimite: $fechaLimite
    ) {
      id
      companyId
      titulo
      estado
    }
  }
`;

const UPDATE_ESTADO = gql`
  mutation UpdateVacancyEstado($id: ID!, $estado: String!) {
    updateVacancy(id: $id, estado: $estado) {
      id
      estado
    }
  }
`;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length ? value : null;

const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function normalizeRemuneracion(raw: unknown): VacancyRemuneracion | null {
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

function normalizeVacancy(raw: Record<string, unknown>): Vacancy {
  return {
    id: String(raw['id'] ?? raw['_id'] ?? ''),
    companyId: asString(raw['companyId']),
    recruiterId: asString(raw['recruiterId']),
    titulo: String(raw['titulo'] ?? 'Sin título'),
    descripcion: asString(raw['descripcion']),
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
  };
}

function normalizeCompany(raw: Record<string, unknown>): CompanyOption {
  return {
    id: String(raw['id'] ?? raw['_id'] ?? ''),
    nombre: String(raw['nombre'] ?? 'Sin nombre'),
  };
}

@Injectable({ providedIn: 'root' })
export class VacancyGraphqlService implements VacancyRepository {
  private readonly apollo = inject(Apollo);

  vacanciesByRecruiter(recruiterId: string): Observable<OfferItem[]> {
    // Se pide en paralelo para resolver el nombre de la empresa contra `companies`.
    return forkJoin({
      vacancies: this.apollo
        .query<{ vacanciesByRecruiter: Array<Record<string, unknown>> | null }>({
          query: VACANCIES_BY_RECRUITER,
          variables: { recruiterId },
          fetchPolicy: 'network-only',
        })
        .pipe(map(result => result.data?.vacanciesByRecruiter ?? [])),
      companies: this.companies(),
    }).pipe(
      map(({ vacancies, companies }) => {
        const byId = new Map(companies.map(company => [company.id, company.nombre]));
        return vacancies.map(raw => {
          const vacancy = normalizeVacancy(raw);
          return { ...vacancy, companyName: vacancy.companyId ? (byId.get(vacancy.companyId) ?? null) : null };
        });
      }),
    );
  }

  companies(): Observable<CompanyOption[]> {
    return this.apollo
      .query<{ companies: Array<Record<string, unknown>> | null }>({
        query: COMPANIES,
        fetchPolicy: 'network-only',
      })
      .pipe(map(result => (result.data?.companies ?? []).map(normalizeCompany)));
  }

  createCompany(input: CompanyInput): Observable<CompanyOption> {
    return this.apollo
      .mutate<{ createCompany: Record<string, unknown> | null }>({
        mutation: CREATE_COMPANY,
        variables: {
          nombre: input.nombre,
          contacto: { email: input.contactoEmail },
          ubicacion: { pais: input.ubicacionPais },
        },
      })
      .pipe(
        map(result => {
          const created = result.data?.createCompany;
          if (!created) throw new Error('No se pudo crear la empresa');
          return normalizeCompany(created);
        }),
      );
  }

  createVacancy(input: VacancyInput): Observable<Vacancy> {
    return this.apollo
      .mutate<{ createVacancy: Record<string, unknown> | null }>({
        mutation: CREATE_VACANCY,
        variables: {
          companyId: input.companyId,
          recruiterId: input.recruiterId,
          titulo: input.titulo,
          descripcion: input.descripcion ?? null,
          tecnologias: input.tecnologias ?? null,
          nivelExperiencia: input.nivelExperiencia ?? null,
          modalidad: input.modalidad ?? null,
          tipoContrato: input.tipoContrato ?? null,
          ubicacion: input.ubicacion ?? null,
          remuneracion: input.remuneracion ?? null,
          fechaLimite: input.fechaLimite ?? null,
        },
      })
      .pipe(
        map(result => {
          const created = result.data?.createVacancy;
          if (!created) throw new Error('No se pudo crear la vacante');
          return normalizeVacancy(created);
        }),
      );
  }

  updateEstado(id: string, estado: string): Observable<Vacancy> {
    return this.apollo
      .mutate<{ updateVacancy: Record<string, unknown> | null }>({
        mutation: UPDATE_ESTADO,
        variables: { id, estado },
      })
      .pipe(
        map(result => {
          const updated = result.data?.updateVacancy;
          if (!updated) throw new Error('No se pudo actualizar la vacante');
          return normalizeVacancy(updated);
        }),
      );
  }
}
