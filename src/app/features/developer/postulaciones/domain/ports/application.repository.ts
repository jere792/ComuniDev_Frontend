import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Application } from '@features/developer/postulaciones/domain/models/application.model';

export interface ApplicationRepository {
  /** Postulaciones del developer (HU-43); `vacancy` viene resuelta. */
  myApplications(developerId: string, page?: number, size?: number): Observable<Application[]>;
  /** HU-43: una sola postulación por vacante; la carta de presentación es opcional. */
  applyToVacancy(
    vacancyId: string,
    developerId: string,
    cartaPresentacion?: string,
  ): Observable<Application | null>;
  /** El developer retira su postulación; el registro queda en estado RETIRADA. */
  withdrawApplication(applicationId: string): Observable<boolean>;
}

export const APPLICATION_REPOSITORY = new InjectionToken<ApplicationRepository>('ApplicationRepository');
