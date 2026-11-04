import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { filter, map, Observable } from 'rxjs';
import {
  Application,
  ApplicationStatusEvent,
  ApplicationVacancy,
} from '@features/developer/postulaciones/domain/models/application.model';
import { ApplicationRepository } from '@features/developer/postulaciones/domain/ports/application.repository';

const MY_APPLICATIONS = gql`
  query MyApplications($developerId: String!, $page: Int, $size: Int) {
    myApplications(developerId: $developerId, page: $page, size: $size) {
      id
      vacancyId
      developerId
      cartaPresentacion
      estado
      reclutadorAsignadoId
      createdAt
      updatedAt
      vacancy {
        id
        titulo
        estado
        fechaLimite
        company {
          nombre
          logoUrl
        }
      }
    }
  }
`;

const APPLY_TO_VACANCY = gql`
  mutation ApplyToVacancy($vacancyId: String!, $developerId: String!, $cartaPresentacion: String) {
    applyToVacancy(
      vacancyId: $vacancyId
      developerId: $developerId
      cartaPresentacion: $cartaPresentacion
    ) {
      id
      vacancyId
      developerId
      cartaPresentacion
      estado
      createdAt
      updatedAt
      vacancy {
        id
        titulo
        estado
        fechaLimite
        company {
          nombre
          logoUrl
        }
      }
    }
  }
`;

const WITHDRAW_APPLICATION = gql`
  mutation WithdrawApplication($applicationId: String!) {
    withdrawApplication(applicationId: $applicationId)
  }
`;

const APPLICATION_STATUS_CHANGED = gql`
  subscription ApplicationStatusChanged($userId: String!) {
    applicationStatusChanged(userId: $userId) {
      applicationId
      vacancyId
      vacancyTitulo
      estado
      actorId
      createdAt
    }
  }
`;

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length ? value : null;

function normalizeVacancy(raw: unknown): ApplicationVacancy | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const companyRaw = v['company'];
  const company =
    companyRaw && typeof companyRaw === 'object'
      ? {
          nombre: String((companyRaw as Record<string, unknown>)['nombre'] ?? ''),
          logoUrl: asString((companyRaw as Record<string, unknown>)['logoUrl']),
        }
      : null;
  return {
    id: String(v['id'] ?? ''),
    titulo: String(v['titulo'] ?? 'Sin título'),
    estado: asString(v['estado']),
    fechaLimite: asString(v['fechaLimite']),
    company,
  };
}

function normalizeApplication(raw: Record<string, unknown>): Application {
  return {
    id: String(raw['id'] ?? ''),
    vacancyId: String(raw['vacancyId'] ?? ''),
    developerId: String(raw['developerId'] ?? ''),
    cartaPresentacion: asString(raw['cartaPresentacion']),
    estado: String(raw['estado'] ?? 'ENVIADA'),
    reclutadorAsignadoId: asString(raw['reclutadorAsignadoId']),
    createdAt: asString(raw['createdAt']),
    updatedAt: asString(raw['updatedAt']),
    vacancy: normalizeVacancy(raw['vacancy']),
  };
}

function normalizeStatusEvent(raw: Record<string, unknown>): ApplicationStatusEvent {
  return {
    applicationId: String(raw['applicationId'] ?? ''),
    vacancyId: asString(raw['vacancyId']),
    vacancyTitulo: asString(raw['vacancyTitulo']),
    estado: String(raw['estado'] ?? ''),
    actorId: asString(raw['actorId']),
    createdAt: asString(raw['createdAt']),
  };
}

@Injectable({ providedIn: 'root' })
export class ApplicationGraphqlService implements ApplicationRepository {
  private readonly apollo = inject(Apollo);

  myApplications(developerId: string, page?: number, size?: number): Observable<Application[]> {
    return this.apollo
      .query<{ myApplications: Array<Record<string, unknown>> | null }>({
        query: MY_APPLICATIONS,
        variables: { developerId, page: page ?? null, size: size ?? null },
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => (result.data?.myApplications ?? []).map(normalizeApplication)));
  }

  applyToVacancy(
    vacancyId: string,
    developerId: string,
    cartaPresentacion?: string,
  ): Observable<Application | null> {
    return this.apollo
      .mutate<{ applyToVacancy: Record<string, unknown> | null }>({
        mutation: APPLY_TO_VACANCY,
        variables: {
          vacancyId,
          developerId,
          cartaPresentacion: cartaPresentacion?.trim() ? cartaPresentacion.trim() : null,
        },
      })
      .pipe(map((result) => (result.data?.applyToVacancy ? normalizeApplication(result.data.applyToVacancy) : null)));
  }

  withdrawApplication(applicationId: string): Observable<boolean> {
    return this.apollo
      .mutate<{ withdrawApplication: boolean | null }>({
        mutation: WITHDRAW_APPLICATION,
        variables: { applicationId },
      })
      .pipe(map((result) => !!result.data?.withdrawApplication));
  }

  applicationStatusChanged(userId: string): Observable<ApplicationStatusEvent> {
    return this.apollo
      .subscribe<{ applicationStatusChanged: Record<string, unknown> | null }>({
        query: APPLICATION_STATUS_CHANGED,
        variables: { userId },
      })
      .pipe(
        map((result) => result.data?.applicationStatusChanged),
        filter((event): event is Record<string, unknown> => event != null),
        map(normalizeStatusEvent),
      );
  }
}
