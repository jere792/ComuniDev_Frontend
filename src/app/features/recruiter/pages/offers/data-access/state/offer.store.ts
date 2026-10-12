import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import {
  CompanyInput,
  CompanyOption,
  OfferItem,
  Vacancy,
  VacancyInput,
} from '@features/recruiter/pages/offers/domain/models/vacancy.model';
import {
  VACANCY_REPOSITORY,
  VacancyRepository,
} from '@features/recruiter/pages/offers/domain/ports/vacancy.repository';

@Injectable({ providedIn: 'root' })
export class OfferStore {
  private readonly repository = inject<VacancyRepository>(VACANCY_REPOSITORY);

  readonly offers = signal<OfferItem[]>([]);
  readonly companies = signal<CompanyOption[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  load(recruiterId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.repository.vacanciesByRecruiter(recruiterId).subscribe({
      next: offers => {
        this.offers.set(offers);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las ofertas');
        this.loading.set(false);
      },
    });
  }

  loadCompanies(): void {
    this.repository.companies().subscribe({
      next: companies => this.companies.set(companies),
      error: () => this.companies.set([]),
    });
  }

  createCompany(input: CompanyInput): Observable<CompanyOption> {
    return this.repository.createCompany(input).pipe(
      tap(company => {
        this.companies.update(list => [...list, company]);
      }),
    );
  }

  create(recruiterId: string, input: Omit<VacancyInput, 'recruiterId'>): Observable<Vacancy> {
    this.saving.set(true);

    return this.repository.createVacancy({ ...input, recruiterId }).pipe(
      tap(() => this.load(recruiterId)),
      // finalize para que quede en false también si la mutación falla.
      finalize(() => this.saving.set(false)),
    );
  }

  /** HU-41: cambia el estado en el servidor y refleja el cambio en la lista. */
  setEstado(id: string, estado: string): Observable<Vacancy> {
    return this.repository.updateEstado(id, estado).pipe(
      tap(() => {
        this.offers.update(list =>
          list.map(offer => (offer.id === id ? { ...offer, estado } : offer)),
        );
      }),
    );
  }
}
