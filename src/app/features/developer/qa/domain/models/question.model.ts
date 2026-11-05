/** Pregunta técnica del módulo Q&A (schema `Question`). */
export interface Question {
  id: string;
  autorId: string;
  titulo: string;
  descripcion: string;
  /** Bloque de código de apoyo incluido por el autor. */
  codigoEjemplo: string | null;
  etiquetas: string[];
  categoria: string | null;
  /** ABIERTA | RESUELTA | CERRADA */
  estado: string;
  respuestaAceptadaId: string | null;
  votosCount: number;
  respuestasCount: number;
  vistasCount: number;
  /** Oculta por el autor: no aparece en los listados públicos. */
  oculto: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Respuesta a una pregunta (schema `Answer`). */
export interface Answer {
  id: string;
  questionId: string;
  autorId: string;
  contenido: string;
  codigoEjemplo: string | null;
  votosCount: number;
  aceptada: boolean;
  oculto: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Filtros del listado público; todos opcionales. */
export interface QuestionFilters {
  categoria?: string;
  etiqueta?: string;
  /** ABIERTA | RESUELTA | CERRADA | TODAS */
  estado?: string;
  /** Texto libre sobre título o descripción. */
  q?: string;
}

/** Datos para publicar una pregunta. */
export interface QuestionInput {
  titulo: string;
  descripcion: string;
  codigoEjemplo?: string;
  etiquetas: string[];
  categoria?: string;
}

/** Campos editables de una pregunta; null = sin cambio en el backend. */
export interface QuestionUpdateInput {
  titulo?: string;
  descripcion?: string;
  codigoEjemplo?: string;
  etiquetas?: string[];
  categoria?: string;
}

/** Estados del backend y sus etiquetas para la interfaz. */
export const ESTADO_ABIERTA = 'ABIERTA';
export const ESTADO_RESUELTA = 'RESUELTA';
export const ESTADO_CERRADA = 'CERRADA';

export const ESTADOS_PREGUNTA: Array<{ valor: string; label: string }> = [
  { valor: '', label: 'Todas' },
  { valor: ESTADO_ABIERTA, label: 'Abiertas' },
  { valor: ESTADO_RESUELTA, label: 'Resueltas' },
  { valor: ESTADO_CERRADA, label: 'Cerradas' },
];

const ESTADO_LABELS: Record<string, string> = {
  [ESTADO_ABIERTA]: 'Abierta',
  [ESTADO_RESUELTA]: 'Resuelta',
  [ESTADO_CERRADA]: 'Cerrada',
};

const ESTADO_CLASES: Record<string, string> = {
  [ESTADO_ABIERTA]: 'estado-abierta',
  [ESTADO_RESUELTA]: 'estado-resuelta',
  [ESTADO_CERRADA]: 'estado-cerrada',
};

/** Categorías sugeridas para el formulario y el filtro (el backend acepta texto libre). */
export const CATEGORIAS_QA: string[] = [
  'Frontend',
  'Backend',
  'Bases de datos',
  'DevOps',
  'Mobile',
  'IA / Datos',
  'Seguridad',
  'Arquitectura',
  'Otros',
];

export function estadoLabel(estado?: string | null): string {
  const clave = (estado ?? '').toUpperCase();
  return ESTADO_LABELS[clave] ?? (clave || 'Abierta');
}

export function estadoClase(estado?: string | null): string {
  const clave = (estado ?? '').toUpperCase();
  return ESTADO_CLASES[clave] ?? 'estado-abierta';
}

/** Extracto plano de la descripción para las tarjetas del listado. */
export function extracto(texto: string | null | undefined, maximo = 220): string {
  const limpio = (texto ?? '').replace(/\s+/g, ' ').trim();
  return limpio.length > maximo ? `${limpio.slice(0, maximo).trimEnd()}…` : limpio;
}

/** Iniciales del autor para el avatar cuando no hay foto. */
export function iniciales(nombre: string | null | undefined): string {
  const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const primera = partes[0].charAt(0);
  const segunda = partes.length > 1 ? partes[1].charAt(0) : '';
  return (primera + segunda).toUpperCase();
}
