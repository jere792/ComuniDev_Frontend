import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Reporte de contenido (comentarios, reels, etc.) hacia el backend para moderación. */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);

  report(reporterId: string, targetType: string, targetId: string, motivo: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/reports`, { reporterId, targetType, targetId, motivo });
  }
}
