import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { Company, CompanyInput } from '@features/recruiter/pages/company/domain/models/company.model';
import {
  COMPANY_REPOSITORY,
  CompanyRepository,
} from '@features/recruiter/pages/company/domain/ports/company.repository';

@Injectable({ providedIn: 'root' })
export class CompanyStore {
  private readonly repository = inject<CompanyRepository>(COMPANY_REPOSITORY);

  readonly myCompany = signal<Company | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  loadMyCompany(recruiterId: string): Observable<Company | null> {
    this.loading.set(true);
    this.error.set(null);

    return this.repository.myCompany(recruiterId).pipe(
      tap(company => this.myCompany.set(company)),
      finalize(() => this.loading.set(false)),
    );
  }

  /** Crea si aún no existe; actualiza si ya existe. */
  save(recruiterId: string, id: string | null, input: CompanyInput): Observable<Company> {
    this.saving.set(true);

    const request$ = id
      ? this.repository.updateCompany(id, input)
      : this.repository.createCompany({ ...input, recruiterId });

    return request$.pipe(
      tap(company => this.myCompany.set(company)),
      finalize(() => this.saving.set(false)),
    );
  }
}
