import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CompanyInput,
  CompanyOption,
  OfferItem,
  Vacancy,
  VacancyInput,
} from '@features/recruiter/pages/offers/domain/models/vacancy.model';

export interface VacancyRepository {
  /** "Mis Ofertas" (HU-44): las que publicó ese reclutador. */
  vacanciesByRecruiter(recruiterId: string): Observable<OfferItem[]>;
  /** Empresas existentes, para poblar el selector del formulario. */
  companies(): Observable<CompanyOption[]>;
  createCompany(input: CompanyInput): Observable<CompanyOption>;
  createVacancy(input: VacancyInput): Observable<Vacancy>;
  /** HU-41: cambia el estado manualmente (ACTIVA / PAUSADA / CERRADA). */
  updateEstado(id: string, estado: string): Observable<Vacancy>;
}

export const VACANCY_REPOSITORY = new InjectionToken<VacancyRepository>('VacancyRepository');

export type { CompanyInput, CompanyOption, OfferItem, Vacancy, VacancyInput };
