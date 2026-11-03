/** Anuncio EcoDev (ODS 12), schema `EcotechPost`. */
export interface EcotechPost {
  id: string;
  /** Autor del anuncio; será el receptor de sus transacciones. */
  autorId: string;
  /** DONACION | INTERCAMBIO | REPARACION | REUTILIZACION | RECICLAJE | CAMPANA | CONSEJO_GREEN_IT */
  tipo: string;
  titulo: string;
  descripcion: string | null;
  /** LAPTOP | CELULAR | TABLET | MONITOR | TECLADO | MOUSE | CABLE | PERIFERICO | OTRO */
  categoriaEquipo: string;
  /** FUNCIONAL | FUNCIONAL_CON_REPARACION_MENOR | PARA_REPARAR | PARA_REPUESTOS | NO_FUNCIONAL */
  condicion: string;
  /** URLs de fotos (Cloudinary). */
  imagenes: string[];
  ciudad: string | null;
  distrito: string | null;
  lat: number | null;
  lng: number | null;
  etiquetas: string[];
  advertenciaSeguridad: string | null;
  /** ACTIVA (visible y coordinable) | CERRADA */
  estado: string;
  interesadosCount: number;
  createdAt: string | null;
}

/** Punto de reciclaje verificado, schema `RecyclingPoint`. */
export interface RecyclingPoint {
  id: string;
  nombre: string;
  /** PUNTO_PERMANENTE | CAMPANA_TEMPORAL */
  tipo: string | null;
  organizacion: string | null;
  descripcion: string | null;
  pais: string | null;
  ciudad: string | null;
  distrito: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  materialesAceptados: string[];
  horario: string | null;
  telefono: string | null;
  email: string | null;
  /** PENDIENTE | VERIFICADO | RECHAZADO | INACTIVO */
  estadoVerificacion: string;
}

/** Transacción entre interesado (emisor) y autor del anuncio (receptor). */
export interface EcotechTransaction {
  id: string;
  ecotechPostId: string;
  emisorId: string;
  receptorId: string;
  /** Copia el tipo del anuncio (DONACION, INTERCAMBIO...). */
  tipo: string | null;
  /** PENDIENTE_CONFIRMACION | COMPLETADA | CANCELADA | RECHAZADA | EN_DISPUTA */
  estado: string;
  cantidadEquipos: number;
  confirmadoPorEmisor: boolean;
  confirmadoPorReceptor: boolean;
  fechaCompletado: string | null;
  createdAt: string | null;
}

/** Impacto ODS 12: solo transacciones COMPLETADA alimentan las métricas. */
export interface EcotechImpacto {
  donaciones: number;
  intercambios: number;
  reciclajes: number;
  reparaciones: number;
  reutilizaciones: number;
  campanas: number;
  /** Suma de cantidadEquipos de todas las transacciones completadas. */
  equiposTotal: number;
}

/** Lo mínimo del anuncio para crearlo desde el formulario. */
export interface EcotechPostInput {
  tipo: string;
  titulo: string;
  descripcion?: string;
  categoriaEquipo: string;
  condicion: string;
  imagenes?: string[];
  ciudad?: string;
  distrito?: string;
  lat?: number;
  lng?: number;
  etiquetas?: string[];
  advertenciaSeguridad?: string;
}

/** Filtros del listado de anuncios (todos opcionales). */
export interface EcotechPostsFiltro {
  tipo?: string;
  categoriaEquipo?: string;
  estado?: string;
  page?: number;
  size?: number;
}

/** Filtos de transacciones: por anuncio, por participante y/o por estado. */
export interface EcotechTransactionsFiltro {
  postId?: string;
  userId?: string;
  estado?: string;
  page?: number;
  size?: number;
}

/** Emoji, etiqueta en español y color de cada tipo de anuncio. */
export const TIPO_META: Record<string, { label: string; emoji: string; color: string }> = {
  DONACION: { label: 'Donación', emoji: '🎁', color: '#15803d' },
  INTERCAMBIO: { label: 'Intercambio', emoji: '🔄', color: '#0b6cb0' },
  REPARACION: { label: 'Reparación', emoji: '🔧', color: '#a16207' },
  REUTILIZACION: { label: 'Reutilización', emoji: '♻️', color: '#00695c' },
  RECICLAJE: { label: 'Reciclaje', emoji: '🗑️', color: '#6d4cd1' },
  CAMPANA: { label: 'Campaña', emoji: '📢', color: '#b45309' },
  CONSEJO_GREEN_IT: { label: 'Consejo green IT', emoji: '💡', color: '#0f766e' },
};

export const CATEGORIAS_EQUIPO: Record<string, string> = {
  LAPTOP: 'Laptop',
  CELULAR: 'Celular',
  TABLET: 'Tablet',
  MONITOR: 'Monitor',
  TECLADO: 'Teclado',
  MOUSE: 'Mouse',
  CABLE: 'Cable',
  PERIFERICO: 'Periférico',
  OTRO: 'Otro',
};

export const CONDICIONES: Record<string, string> = {
  FUNCIONAL: 'Funcional',
  FUNCIONAL_CON_REPARACION_MENOR: 'Funcional con reparación menor',
  PARA_REPARAR: 'Para reparar',
  PARA_REPUESTOS: 'Para repuestos',
  NO_FUNCIONAL: 'No funcional',
};

/** Estado de una transacción con su símbolo y su clase CSS. */
export const TX_ESTADO_META: Record<string, { label: string; emoji: string; clase: string }> = {
  PENDIENTE_CONFIRMACION: { label: 'Pendiente de confirmación', emoji: '⏳', clase: 'tx-pendiente' },
  COMPLETADA: { label: 'Completada', emoji: '✅', clase: 'tx-completada' },
  CANCELADA: { label: 'Cancelada', emoji: '✗', clase: 'tx-cancelada' },
  RECHAZADA: { label: 'Rechazada', emoji: '✗', clase: 'tx-cancelada' },
  EN_DISPUTA: { label: 'En disputa', emoji: '⚠️', clase: 'tx-pendiente' },
};

export function tipoMeta(tipo?: string | null): { label: string; emoji: string; color: string } {
  return TIPO_META[(tipo ?? '').toUpperCase()] ?? { label: tipo ?? 'Anuncio', emoji: '🌐', color: '#0f766e' };
}

export function categoriaLabel(categoria?: string | null): string {
  const value = (categoria ?? '').toUpperCase();
  return CATEGORIAS_EQUIPO[value] ?? categoria ?? '';
}

export function condicionLabel(condicion?: string | null): string {
  const value = (condicion ?? '').toUpperCase();
  return CONDICIONES[value] ?? condicion ?? '';
}

export function txEstadoMeta(estado?: string | null): { label: string; emoji: string; clase: string } {
  return TX_ESTADO_META[(estado ?? '').toUpperCase()] ?? { label: estado ?? '', emoji: '•', clase: '' };
}

/** "Ciudad · Distrito" o lo que haya, sin coma final suelta. */
export function ubicacionDe(post: EcotechPost): string {
  return [post.ciudad, post.distrito].filter((parte) => !!parte?.trim()).join(' · ');
}

/** Link simple a Google Maps (sin librería de mapas). */
export function googleMapsLink(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
