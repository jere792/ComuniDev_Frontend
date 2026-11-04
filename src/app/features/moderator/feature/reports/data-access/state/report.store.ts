import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  ContenidoPreview,
  ReportCreatedEvent,
  ReportEstado,
  Reporte,
} from '@features/moderator/feature/reports/domain/models/report.model';
import {
  REPORT_REPOSITORY,
  ReportRepository,
  ResolverReporteInput,
} from '@features/moderator/feature/reports/domain/ports/report.repository';

/** `targetType:targetId` → vista previa ya pedida (evita repetir la consulta). */
type PreviewKey = string;

@Injectable({ providedIn: 'root' })
export class ReportStore {
  private repository = inject<ReportRepository>(REPORT_REPOSITORY);

  readonly reports = signal<Reporte[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** Filtro visible: pendientes (la cola) o resueltos (historial). */
  readonly estado = signal<ReportEstado>('PENDIENTE');

  readonly previews = signal<Record<PreviewKey, ContenidoPreview | null>>({});
  readonly previewLoading = signal<string | null>(null);

  /** Carga (o recarga) la cola con el filtro dado; por defecto el actual. */
  load(estado: ReportEstado = this.estado()): void {
    this.estado.set(estado);
    this.loading.set(true);
    this.error.set(null);

    this.repository.listar(estado, 0, 50).subscribe({
      next: (reportes) => {
        this.reports.set(reportes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los reportes');
        this.loading.set(false);
      },
    });
  }

  /**
   * Resuelve un reporte y recarga la cola: al cerrarlo desaparece de
   * "Pendientes" y aparece en "Resueltos" con la acción aplicada.
   */
  resolve(id: string, input: ResolverReporteInput): Observable<Reporte | null> {
    return this.repository.resolver(id, input).pipe(
      tap(() => this.load(this.estado())),
    );
  }

  /** Pide la vista previa del contenido reportado una sola vez por fila. */
  loadPreview(reporte: Reporte): void {
    const key = previewKeyOf(reporte);
    if (key in this.previews()) return;

    this.previewLoading.set(key);
    this.repository.preview(reporte.targetType, reporte.targetId).subscribe({
      next: (contenido) => {
        this.previews.update((actual) => ({ ...actual, [key]: contenido }));
        this.previewLoading.set(null);
      },
      error: () => {
        // sin vista previa la fila sigue mostrando targetType + targetId
        this.previews.update((actual) => ({ ...actual, [key]: null }));
        this.previewLoading.set(null);
      },
    });
  }

  /** Canal global de reportes nuevos; solo lo consume el panel de moderación. */
  subscribeToNewReports(): Observable<ReportCreatedEvent> {
    return this.repository.subscribeToNewReports();
  }

  clear(): void {
    this.reports.set([]);
    this.previews.set({});
    this.error.set(null);
  }
}

export function previewKeyOf(reporte: Pick<Reporte, 'targetType' | 'targetId'>): PreviewKey {
  return `${(reporte.targetType ?? '').toUpperCase()}:${reporte.targetId}`;
}
