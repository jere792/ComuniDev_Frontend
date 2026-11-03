import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { ToastService } from '@core/services/toast.service';
import { ReportResolveModal } from '@features/moderator/feature/reports/ui/resolve-modal/resolve-modal';
import { ReportStore, previewKeyOf } from '@features/moderator/feature/reports/data-access/state/report.store';
import {
  ContenidoPreview,
  ReportAccion,
  ReportEstado,
  Reporte,
  accionLabel,
  esContenido,
  formatFecha,
  tipoContenidoLabel,
} from '@features/moderator/feature/reports/domain/models/report.model';

/** Mensajes de éxito por acción aplicada sobre el reporte. */
const MENSAJES: Record<ReportAccion, string> = {
  RECHAZAR: 'Reporte rechazado; no se tomó acción sobre el contenido',
  OCULTAR: 'Contenido ocultado y reporte resuelto',
  SANCIONAR: 'Contenido ocultado, autor sancionado y reporte resuelto',
};

/** Lee el mensaje de error que devuelve el backend en su `ApiResponse`. */
function mensajeError(err: unknown): string | null {
  const body = (err as { error?: { message?: string } } | null)?.error;
  return typeof body?.message === 'string' && body.message.trim() ? body.message : null;
}

/** Panel de reportes: la cola PENDIENTE y el historial RESUELTO de moderación. */
@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmModal, ReportResolveModal],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
})
export class ReportsPage implements OnInit {
  private readonly store = inject(ReportStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly reports = this.store.reports;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly estado = this.store.estado;
  readonly previews = this.store.previews;
  readonly previewLoading = this.store.previewLoading;

  /** Mismo cálculo que usa el store para cachear las vistas previas. */
  readonly clave = previewKeyOf;

  /** Confirmación simple de "Rechazar" (no pide notas). */
  readonly confirmarRechazarOpen = signal(false);
  /** Modal con notas opcionales para "Ocultar" / "Sancionar". */
  readonly resolverOpen = signal(false);
  readonly accionModal = signal<ReportAccion>('OCULTAR');
  readonly reporteActivo = signal<Reporte | null>(null);
  readonly sending = signal(false);

  /** Fila con la vista previa expandida (`targetType:targetId`). */
  readonly previewAbierto = signal<string | null>(null);

  ngOnInit(): void {
    // La URL manda (?estado=RESUELTO); sin query, el estado inicial lo da la
    // ruta: /moderator/reviews entra con RESUELTO (historial) y
    // /moderator/reports con PENDIENTE (la cola).
    combineLatest([this.route.data, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([data, params]) => {
        const porQuery = params.get('estado');
        const porRuta = data['estadoInicial'];
        const estado: ReportEstado =
          porQuery === 'RESUELTO' || porQuery === 'PENDIENTE'
            ? porQuery
            : porRuta === 'RESUELTO'
              ? 'RESUELTO'
              : 'PENDIENTE';
        this.previewAbierto.set(null);
        this.store.load(estado);
      });
  }

  cambiarEstado(estado: ReportEstado): void {
    if (this.estado() === estado) return;
    // deja el filtro en la URL para que el link del lateral siga coherente y
    // la vista se pueda compartir/recargar en el mismo estado
    this.router.navigate(['/moderator/reports'], { queryParams: { estado } });
  }

  // ------------------------------------------------------------- acciones

  /** Rechazar: solo cierra el reporte, sin tocar el contenido. */
  pedirRechazo(reporte: Reporte): void {
    this.reporteActivo.set(reporte);
    this.confirmarRechazarOpen.set(true);
  }

  confirmarRechazo(): void {
    const reporte = this.reporteActivo();
    // el modal se cierra en `aplicar`, para que muestre el estado de envío
    if (reporte) this.aplicar(reporte, 'RECHAZAR', null);
  }

  /** Ocultar / Sancionar: el modal pide notas opcionales. */
  pedirAccion(reporte: Reporte, accion: ReportAccion): void {
    this.reporteActivo.set(reporte);
    this.accionModal.set(accion);
    this.resolverOpen.set(true);
  }

  confirmarAccion(notas: string): void {
    const reporte = this.reporteActivo();
    if (reporte) this.aplicar(reporte, this.accionModal(), notas || null);
  }

  cerrarModales(): void {
    this.confirmarRechazarOpen.set(false);
    this.resolverOpen.set(false);
    this.reporteActivo.set(null);
  }

  private aplicar(reporte: Reporte, accion: ReportAccion, notas: string | null): void {
    if (this.sending()) return;
    const moderadorId = localStorage.getItem('userId');
    if (!moderadorId) {
      this.cerrarModales();
      this.toast.error('No se encontró tu usuario en sesión');
      return;
    }

    this.sending.set(true);
    this.store.resolve(reporte.id, { accion, moderadorId, notas }).subscribe({
      next: (resuelto) => {
        this.sending.set(false);
        this.cerrarModales();
        if (resuelto) {
          this.toast.success(MENSAJES[accion]);
        } else {
          this.toast.error('No se pudo resolver el reporte');
        }
      },
      error: (err) => {
        this.sending.set(false);
        this.cerrarModales();
        this.toast.error(mensajeError(err) ?? 'No se pudo resolver el reporte');
      },
    });
  }

  // -------------------------------------------------------- vista previa

  verPreview(reporte: Reporte): void {
    const key = previewKeyOf(reporte);
    if (this.previewAbierto() === key) {
      this.previewAbierto.set(null);
      return;
    }
    this.previewAbierto.set(key);
    this.store.loadPreview(reporte);
  }

  previewDe(reporte: Reporte): ContenidoPreview | null | undefined {
    return this.previews()[previewKeyOf(reporte)];
  }

  previewSinContenido(reporte: Reporte): boolean {
    return this.previewDe(reporte) === null;
  }

  previewTexto(reporte: Reporte): string {
    return this.previewDe(reporte)?.texto?.trim() ?? '';
  }

  previewAutor(reporte: Reporte): string | null {
    return this.previewDe(reporte)?.autorId ?? null;
  }

  // --------------------------------------------------------------- formato

  fecha(value: Reporte['createdAt']): string {
    return formatFecha(value);
  }

  fechaResolucion(reporte: Reporte): string {
    return formatFecha(reporte.resueltoEn);
  }

  tipoLabel(targetType: string): string {
    return tipoContenidoLabel(targetType);
  }

  /** Clase CSS del badge de tipo (`tipo-post`, `tipo-reel`, …). */
  tipoClase(targetType: string): string {
    return `tipo-${(targetType ?? '').trim().toLowerCase()}`;
  }

  esTipoContenido(targetType: string): boolean {
    return esContenido(targetType);
  }

  esUsuario(reporte: Reporte): boolean {
    return (reporte.targetType ?? '').trim().toUpperCase() === 'USER';
  }

  /** Reporte de problema hacia soporte: sin contenido ni usuario que previsualizar. */
  esSoporte(targetType: string): boolean {
    return (targetType ?? '').trim().toUpperCase() === 'SUPPORT';
  }

  accionDe(reporte: Reporte): string {
    return accionLabel(reporte.accionResolucion);
  }

  /** Corta un id de 24 caracteres para que la tabla no se desborde. */
  corto(id: string | null | undefined): string {
    if (!id) return '—';
    return id.length > 10 ? `${id.slice(0, 8)}…` : id;
  }

  trackById(_index: number, reporte: Reporte): string {
    return reporte.id;
  }
}
