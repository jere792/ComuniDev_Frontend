import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import {
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
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  /** Paginado de "Mis Ofertas": pagina 0 con 50 y mas al llegar al final. */
  readonly hayMas = signal(false);
  readonly cargandoMas = signal(false);
  private pagina = 0;
  private static readonly TAMANO = 20;

  load(recruiterId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.pagina = 0;
    this.hayMas.set(false);

    this.repository.vacanciesByRecruiter(recruiterId, 0, OfferStore.TAMANO).subscribe({
      next: offers => {
        this.offers.set(offers);
        this.hayMas.set(offers.length >= OfferStore.TAMANO);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las ofertas');
        this.loading.set(false);
      },
    });
  }

  /** Trae la siguiente pagina de ofertas y la agrega a la lista. */
  cargarMas(recruiterId: string): void {
    if (this.cargandoMas() || !this.hayMas()) return;
    this.pagina += 1;
    this.cargandoMas.set(true);
    this.repository.vacanciesByRecruiter(recruiterId, this.pagina, OfferStore.TAMANO).subscribe({
      next: ofertas => {
        this.hayMas.set(ofertas.length >= OfferStore.TAMANO);
        this.offers.update(actual => [...actual, ...ofertas]);
        this.cargandoMas.set(false);
      },
      error: () => this.cargandoMas.set(false),
    });
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
