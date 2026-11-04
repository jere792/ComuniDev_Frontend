import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ContenidoPreview,
  ReportAccion,
  ReportCreatedEvent,
  ReportEstado,
  Reporte,
} from '@features/moderator/feature/reports/domain/models/report.model';

export interface ResolverReporteInput {
  accion: ReportAccion;
  /** Id del moderador en sesión (lo manda el cliente hasta que haya JWT). */
  moderadorId: string | null;
  notas?: string | null;
}

export interface ReportRepository {
  /** Cola de moderación paginada: `PENDIENTE` o `RESUELTO` (historial). */
  listar(estado: ReportEstado, page?: number, size?: number): Observable<Reporte[]>;
  /** Cierra un reporte pendiente; el backend oculta/sanciona según la acción. */
  resolver(id: string, input: ResolverReporteInput): Observable<Reporte | null>;
  /** Vista previa opcional del contenido reportado (GraphQL `post`/`reel`/…). */
  preview(targetType: string, targetId: string): Observable<ContenidoPreview | null>;
  /** Cada reporte nuevo, en vivo (GraphQL `reportCreated`, sin argumentos). */
  subscribeToNewReports(): Observable<ReportCreatedEvent>;
}

export const REPORT_REPOSITORY = new InjectionToken<ReportRepository>('ReportRepository');
