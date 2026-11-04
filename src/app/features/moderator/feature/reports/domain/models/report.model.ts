/** Estado del reporte: cola de moderación o ya resuelto. */
export type ReportEstado = 'PENDIENTE' | 'RESUELTO';

/**
 * Acción aplicada al resolver. RECHAZAR solo cierra el reporte; OCULTAR saca el
 * contenido del feed; SANCIONAR lo oculta y penaliza al autor (backend).
 */
export type ReportAccion = 'OCULTAR' | 'RECHAZAR' | 'SANCIONAR';

/**
 * Fecha tal como llega del REST: el backend mezcla `Instant` (epoch o ISO) y
 * `LocalDateTime` (ISO o array de componentes), así que se tipa abierto y se
 * normaliza con `formatFecha`.
 */
export type JsonFecha = string | number | number[] | null;

/** Evento global `reportCreated` que recibe el panel de moderación. */
export interface ReportCreatedEvent {
  reportId: string;
  /** COMMENT | REEL | POST | USER | SUPPORT */
  targetType: string;
  targetId: string | null;
  motivo: string | null;
  createdAt: JsonFecha;
}

/** Reporte de contenido (POST | REEL | COMMENT | USER) hacia moderación. */
export interface Reporte {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  motivo: string;
  estado: string;
  /** null hasta resolver. */
  accionResolucion: string | null;
  moderadorId: string | null;
  notas: string | null;
  resueltoEn: JsonFecha;
  createdAt: JsonFecha;
}

/** Vista previa opcional del contenido reportado (GraphQL post/reel/comment/user). */
export interface ContenidoPreview {
  autorId: string | null;
  texto: string | null;
}

export const TARGET_LABELS: Record<string, string> = {
  POST: 'Publicación',
  REEL: 'Reel',
  COMMENT: 'Comentario',
  USER: 'Usuario',
  SUPPORT: 'Soporte',
};

export const ACCION_LABELS: Record<string, string> = {
  OCULTAR: 'Ocultar',
  RECHAZAR: 'Rechazar',
  SANCIONAR: 'Sancionar',
};

export const ACCION_ICONOS: Record<string, string> = {
  OCULTAR: 'visibility_off',
  RECHAZAR: 'block',
  SANCIONAR: 'gavel',
};

/** Tipos que sí son contenido ocultable (los demás solo se muestran). */
const TIPOS_CONTENIDO = ['POST', 'REEL', 'COMMENT'];

export function tipoContenidoLabel(targetType: string): string {
  const key = (targetType ?? '').trim().toUpperCase();
  return TARGET_LABELS[key] ?? targetType ?? 'Contenido';
}

export function accionLabel(accion: string | null | undefined): string {
  if (!accion) return '—';
  const key = accion.trim().toUpperCase();
  return ACCION_LABELS[key] ?? accion;
}

export function esContenido(targetType: string): boolean {
  return TIPOS_CONTENIDO.includes((targetType ?? '').trim().toUpperCase());
}

const FECHA_FORMAT = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Convierte cualquier formato de fecha del backend a un `Date` (o null). */
function toDate(value: JsonFecha | Date | unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  if (Array.isArray(value) && value.length >= 3) {
    // LocalDateTime como array: [año, mes (1-12), día, hora, minuto, segundo]
    const [year, month, day, hour = 0, minute = 0, second = 0] = value as number[];
    const date = new Date(year, month - 1, day, hour, minute, second);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/** Fecha legible para la cola de reportes; `—` si el backend no manda nada. */
export function formatFecha(value: JsonFecha | Date | unknown): string {
  const date = toDate(value);
  return date ? FECHA_FORMAT.format(date) : '—';
}
