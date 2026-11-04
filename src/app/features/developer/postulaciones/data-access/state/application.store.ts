import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subscription, tap } from 'rxjs';
import { ToastService } from '@core/services/toast.service';
import {
  Application,
  ApplicationStatusEvent,
  ESTADO_LABELS,
} from '@features/developer/postulaciones/domain/models/application.model';
import {
  APPLICATION_REPOSITORY,
  ApplicationRepository,
} from '@features/developer/postulaciones/domain/ports/application.repository';

@Injectable({ providedIn: 'root' })
export class ApplicationStore {
  private repository = inject<ApplicationRepository>(APPLICATION_REPOSITORY);
  private readonly toast = inject(ToastService);

  readonly applications = signal<Application[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Suscripción única al canal de tiempo real del developer. */
  private suscripcion: Subscription | null = null;
  private usuarioEscuchando: string | null = null;
  /** Vacante con el detalle abierto: ese cambio ya se ve en pantalla, sin toast. */
  private vacancyEnDetalle: string | null = null;
  /** Ids ya recargados para no repetir la carga si el evento no llega a la lista. */
  private readonly recargadas = new Set<string>();

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

  /**
   * Se engancha al canal `applicationStatusChanged` una sola vez por developer,
   * aunque "Mis postulaciones" y el detalle de la vacante lo pidan a la vez.
   */
  escuchar(developerId: string): void {
    if (this.usuarioEscuchando === developerId && this.suscripcion && !this.suscripcion.closed) return;

    this.suscripcion?.unsubscribe();
    this.usuarioEscuchando = developerId;
    this.suscripcion = this.repository.applicationStatusChanged(developerId).subscribe({
      next: (event) => this.aplicarEstado(event, developerId),
      // graphql-ws reconecta solo; al volver a la pestaña las páginas recargan.
      error: () => {},
    });
  }

  /** El detalle de esta vacante está abierto: no hace falta avisar por toast. */
  marcarDetalleAbierto(vacancyId: string | null): void {
    this.vacancyEnDetalle = vacancyId;
  }

  /** Refleja el nuevo estado sin recargar la lista; avisa solo si aporta. */
  private aplicarEstado(event: ApplicationStatusEvent, developerId: string): void {
    const actual = this.applications().find((app) => app.id === event.applicationId);

    if (!actual) {
      // No está cargada (otra pestaña postuló, etc.): se recarga, una sola vez.
      if (!this.loading() && !this.recargadas.has(event.applicationId)) {
        this.recargadas.add(event.applicationId);
        this.load(developerId);
      }
      return;
    }

    // El canal puede repetir el mismo evento: nada que actualizar ni avisar.
    if (actual.estado === event.estado) return;

    this.applications.update((list) =>
      list.map((app) =>
        app.id === event.applicationId
          ? { ...app, estado: event.estado, updatedAt: event.createdAt ?? app.updatedAt }
          : app,
      ),
    );

    // Lo cambió el propio usuario (retiro) o el detalle ya lo muestra: sin toast.
    if (event.actorId === developerId) return;
    if (event.vacancyId && event.vacancyId === this.vacancyEnDetalle) return;

    const label = ESTADO_LABELS[event.estado] ?? event.estado;
    const vacante = event.vacancyTitulo ? ` a ${event.vacancyTitulo}` : '';
    this.toast.info(`Tu postulación${vacante} cambió a ${label}`);
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
    this.suscripcion?.unsubscribe();
    this.suscripcion = null;
    this.usuarioEscuchando = null;
    this.vacancyEnDetalle = null;
    this.recargadas.clear();
    this.applications.set([]);
    this.error.set(null);
  }
}
