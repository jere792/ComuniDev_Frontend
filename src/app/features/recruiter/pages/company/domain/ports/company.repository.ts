import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Company,
  CompanyInput,
  CompanyOption,
} from '@features/recruiter/pages/company/domain/models/company.model';

export interface CompanyRepository {
  /** "Mi empresa"; null si el reclutador todavía no creó ninguna. */
  myCompany(recruiterId: string): Observable<Company | null>;
  /** Empresas existentes, para el selector del formulario de oferta. */
  companies(): Observable<CompanyOption[]>;
  createCompany(input: CompanyInput & { recruiterId: string }): Observable<Company>;
  updateCompany(id: string, input: CompanyInput): Observable<Company>;
}

export const COMPANY_REPOSITORY = new InjectionToken<CompanyRepository>('CompanyRepository');

export type { Company, CompanyInput, CompanyOption };
