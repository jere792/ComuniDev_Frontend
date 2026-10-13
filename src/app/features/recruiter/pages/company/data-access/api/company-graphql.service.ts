import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';
import {
  Company,
  CompanyContacto,
  CompanyInput,
  CompanyOption,
  CompanyRedes,
  CompanyUbicacion,
} from '@features/recruiter/pages/company/domain/models/company.model';
import { CompanyRepository } from '@features/recruiter/pages/company/domain/ports/company.repository';

const COMPANY_FIELDS = `
  id
  nombre
  descripcion
  sector
  sitioWeb
  logoUrl
  bannerUrl
  ruc
  fechaCreacion
  ubicacion {
    pais
    ciudad
    distrito
    direccion
  }
  contacto {
    email
    telefono
  }
  redes {
    linkedin
  }
  estadoVerificacion
  vacantesActivasCount
`;

const COMPANY_BY_ID = gql`
  query CompanyById($id: ID!) {
    company(id: $id) {
      ${COMPANY_FIELDS}
    }
  }
`;

const MY_COMPANY = gql`
  query MyCompany($recruiterId: String!) {
    myCompany(recruiterId: $recruiterId) {
      ${COMPANY_FIELDS}
    }
  }
`;

const COMPANIES = gql`
  query Companies {
    companies {
      id
      nombre
      logoUrl
      sector
    }
  }
`;

const CREATE_COMPANY = gql`
  mutation CreateCompany(
    $recruiterId: String!
    $nombre: String!
    $descripcion: String
    $sector: String
    $sitioWeb: String
    $logoUrl: String
    $bannerUrl: String
    $ruc: String
    $fechaCreacion: String
    $ubicacion: CompanyUbicacionInput
    $contacto: CompanyContactoInput
    $redes: CompanyRedesInput
  ) {
    createCompany(
      recruiterId: $recruiterId
      nombre: $nombre
      descripcion: $descripcion
      sector: $sector
      sitioWeb: $sitioWeb
      logoUrl: $logoUrl
      bannerUrl: $bannerUrl
      ruc: $ruc
      fechaCreacion: $fechaCreacion
      ubicacion: $ubicacion
      contacto: $contacto
      redes: $redes
    ) {
      ${COMPANY_FIELDS}
    }
  }
`;

const UPDATE_COMPANY = gql`
  mutation UpdateCompany(
    $id: ID!
    $nombre: String!
    $descripcion: String
    $sector: String
    $sitioWeb: String
    $logoUrl: String
    $bannerUrl: String
    $ruc: String
    $fechaCreacion: String
    $ubicacion: CompanyUbicacionInput
    $contacto: CompanyContactoInput
    $redes: CompanyRedesInput
  ) {
    updateCompany(
      id: $id
      nombre: $nombre
      descripcion: $descripcion
      sector: $sector
      sitioWeb: $sitioWeb
      logoUrl: $logoUrl
      bannerUrl: $bannerUrl
      ruc: $ruc
      fechaCreacion: $fechaCreacion
      ubicacion: $ubicacion
      contacto: $contacto
      redes: $redes
    ) {
      ${COMPANY_FIELDS}
    }
  }
`;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length ? value : null;

function asObject<T>(value: unknown): T | null {
  return value && typeof value === 'object' ? (value as T) : null;
}

function normalizeUbicacion(value: unknown): CompanyUbicacion | null {
  const raw = asObject<Record<string, unknown>>(value);
  if (!raw) return null;
  return {
    pais: asString(raw['pais']),
    ciudad: asString(raw['ciudad']),
    distrito: asString(raw['distrito']),
    direccion: asString(raw['direccion']),
  };
}

function normalizeContacto(value: unknown): CompanyContacto | null {
  const raw = asObject<Record<string, unknown>>(value);
  if (!raw) return null;
  return {
    email: asString(raw['email']),
    telefono: asString(raw['telefono']),
  };
}

function normalizeRedes(value: unknown): CompanyRedes | null {
  const raw = asObject<Record<string, unknown>>(value);
  if (!raw) return null;
  return {
    linkedin: asString(raw['linkedin']),
  };
}

function normalizeCompany(raw: Record<string, unknown>): Company {
  return {
    id: String(raw['id'] ?? raw['_id'] ?? ''),
    nombre: String(raw['nombre'] ?? ''),
    descripcion: asString(raw['descripcion']),
    sector: asString(raw['sector']),
    sitioWeb: asString(raw['sitioWeb']),
    logoUrl: asString(raw['logoUrl']),
    bannerUrl: asString(raw['bannerUrl']),
    ruc: asString(raw['ruc']),
    fechaCreacion: asString(raw['fechaCreacion']),
    ubicacion: normalizeUbicacion(raw['ubicacion']),
    contacto: normalizeContacto(raw['contacto']),
    redes: normalizeRedes(raw['redes']),
    estadoVerificacion: asString(raw['estadoVerificacion']),
    vacantesActivasCount: typeof raw['vacantesActivasCount'] === 'number' ? raw['vacantesActivasCount'] : null,
  };
}

@Injectable({ providedIn: 'root' })
export class CompanyGraphqlService implements CompanyRepository {
  private readonly apollo = inject(Apollo);

  myCompany(recruiterId: string): Observable<Company | null> {
    return this.apollo
      .query<{ myCompany: Record<string, unknown> | null }>({
        query: MY_COMPANY,
        variables: { recruiterId },
        fetchPolicy: 'network-only',
      })
      .pipe(map(result => (result.data?.myCompany ? normalizeCompany(result.data.myCompany) : null)));
  }

  companyById(id: string): Observable<Company | null> {
    return this.apollo
      .query<{ company: Record<string, unknown> | null }>({
        query: COMPANY_BY_ID,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(map(result => (result.data?.company ? normalizeCompany(result.data.company) : null)));
  }

  companies(): Observable<CompanyOption[]> {
    return this.apollo
      .query<{ companies: Array<Record<string, unknown>> | null }>({
        query: COMPANIES,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map(result =>
          (result.data?.companies ?? []).map(raw => ({
            id: String(raw['id'] ?? raw['_id'] ?? ''),
            nombre: String(raw['nombre'] ?? 'Sin nombre'),
            logoUrl: asString(raw['logoUrl']),
            sector: asString(raw['sector']),
          })),
        ),
      );
  }

  createCompany(input: CompanyInput & { recruiterId: string }): Observable<Company> {
    return this.apollo
      .mutate<{ createCompany: Record<string, unknown> | null }>({
        mutation: CREATE_COMPANY,
        variables: this.toVariables(input),
      })
      .pipe(map(result => this.unwrap(result.data?.createCompany)));
  }

  updateCompany(id: string, input: CompanyInput): Observable<Company> {
    return this.apollo
      .mutate<{ updateCompany: Record<string, unknown> | null }>({
        mutation: UPDATE_COMPANY,
        variables: { id, ...this.toVariables(input) },
      })
      .pipe(map(result => this.unwrap(result.data?.updateCompany)));
  }

  /**
   * El backend ignora los `null` en un update ("no tocar"), así que para poder
   * **vaciar** un campo del formulario se envía cadena vacía en vez de null.
   */
  private toVariables(input: CompanyInput): Record<string, unknown> {
    const empty = (value: string | null | undefined): string => value ?? '';

    return {
      recruiterId: (input as { recruiterId?: string }).recruiterId ?? null,
      nombre: input.nombre,
      descripcion: empty(input.descripcion),
      sector: empty(input.sector),
      sitioWeb: empty(input.sitioWeb),
      logoUrl: empty(input.logoUrl),
      bannerUrl: empty(input.bannerUrl),
      ruc: empty(input.ruc),
      fechaCreacion: empty(input.fechaCreacion),
      ubicacion: {
        pais: empty(input.ubicacion?.pais),
        ciudad: empty(input.ubicacion?.ciudad),
        distrito: empty(input.ubicacion?.distrito),
        direccion: empty(input.ubicacion?.direccion),
      },
      contacto: {
        email: empty(input.contacto?.email),
        telefono: empty(input.contacto?.telefono),
      },
      redes: {
        linkedin: empty(input.redes?.linkedin),
      },
    };
  }

  private unwrap(payload: Record<string, unknown> | null | undefined): Company {
    if (!payload) throw new Error('No se pudo guardar la empresa');
    return normalizeCompany(payload);
  }
}
