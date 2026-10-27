import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  OfferItem,
  Vacancy,
  VacancyInput,
} from '@features/recruiter/pages/offers/domain/models/vacancy.model';

export interface VacancyRepository {
  /** "Mis Ofertas" (HU-44): las que publicó ese reclutador. */
  vacanciesByRecruiter(recruiterId: string, page?: number, size?: number): Observable<OfferItem[]>;
  /** Vacantes de una empresa, con los datos de la empresa ya resueltos. */
  vacanciesByCompany(companyId: string): Observable<OfferItem[]>;
  createVacancy(input: VacancyInput): Observable<Vacancy>;
  /** HU-41: cambia el estado manualmente (ACTIVA / PAUSADA / CERRADA). */
  updateEstado(id: string, estado: string): Observable<Vacancy>;
}

export const VACANCY_REPOSITORY = new InjectionToken<VacancyRepository>('VacancyRepository');

export type { OfferItem, Vacancy, VacancyInput };
