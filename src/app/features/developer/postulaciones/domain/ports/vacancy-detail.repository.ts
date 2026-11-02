import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { VacancyDetail } from '@features/developer/postulaciones/domain/models/vacancy-detail.model';

export interface VacancyDetailRepository {
  /** Vacante por id con la empresa ya resuelta (es la que ve el developer antes de postular). */
  vacancyById(id: string): Observable<VacancyDetail | null>;
}

export const VACANCY_DETAIL_REPOSITORY = new InjectionToken<VacancyDetailRepository>('VacancyDetailRepository');
