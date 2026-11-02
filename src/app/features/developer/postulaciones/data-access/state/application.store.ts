import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Application } from '@features/developer/postulaciones/domain/models/application.model';
import {
  APPLICATION_REPOSITORY,
  ApplicationRepository,
} from '@features/developer/postulaciones/domain/ports/application.repository';

@Injectable({ providedIn: 'root' })
export class ApplicationStore {
  private repository = inject<ApplicationRepository>(APPLICATION_REPOSITORY);

  readonly applications = signal<Application[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Carga todas las postulaciones del developer (para la página "Mis postulaciones"). */
  load(developerId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.repository.myApplications(developerId).subscribe({
      next: (applications) => {
        this.applications.set(applications);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus postulaciones');
        this.loading.set(false);
      },
    });
  }

  /** Postulación del developer a una vacante; null si nunca postuló o ya la retiró. */
  findByVacancy(vacancyId: string): Application | null {
    return this.applications().find((app) => app.vacancyId === vacancyId) ?? null;
  }

  applyToVacancy(
    vacancyId: string,
    developerId: string,
    cartaPresentacion?: string,
  ): Observable<Application | null> {
    return this.repository.applyToVacancy(vacancyId, developerId, cartaPresentacion).pipe(
      tap((application) => {
        if (!application) return;
        this.applications.update((list) => [
          application,
          ...list.filter((app) => app.id !== application.id),
        ]);
      }),
    );
  }

  withdrawApplication(applicationId: string): Observable<boolean> {
    return this.repository.withdrawApplication(applicationId).pipe(
      tap((ok) => {
        if (!ok) return;
        // el backend conserva el registro con estado RETIRADA
        this.applications.update((list) =>
          list.map((app) => (app.id === applicationId ? { ...app, estado: 'RETIRADA' } : app)),
        );
      }),
    );
  }

  clear(): void {
    this.applications.set([]);
    this.error.set(null);
  }
}
