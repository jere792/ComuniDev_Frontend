/** Desglose de puntos ganados en una categoría (schema `PuntosCategoria`). */
export interface PuntosCategoria {
  nombre: string;
  puntos: number;
}

/** Saldo de puntos, nivel y rango de un usuario (schema `UserPoints`). */
export interface UserPoints {
  id: string;
  userId: string;
  puntosTotales: number;
  /** Nivel 1 a 50: 1-10 BRONCE, 11-20 PLATA, 21-30 ORO, 31-40 PLATINO, 41-50 DIAMANTE. */
  nivel: number;
  rango: string;
  /** Avance [0..1] dentro del nivel actual. */
  progresoNivel: number;
  puntosBaseNivel: number;
  puntosParaSiguienteNivel: number;
  puntosFaltantes: number;
  puntosPorCategoria: PuntosCategoria[];
  ultimaActualizacion: string | null;
}

/** Lo que trae el ranking por usuario (subset de `UserPoints`). */
export interface RankingPuntos {
  userId: string;
  puntosTotales: number;
  nivel: number;
  rango: string;
  progresoNivel: number;
  puntosFaltantes: number;
}

/** Insignia del catálogo (schema `Badge`). */
export interface Badge {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  /** Emoji del backend (🌱, 🔥, 🥇…). */
  icono: string | null;
  criterioTipo: string | null;
  valorMinimo: number | null;
}

/** Insignia desbloqueada por un usuario (schema `UserBadge`). */
export interface UserBadge {
  id: string;
  userId: string;
  codigo: string;
  obtenidaEn: string | null;
}

/** Insignia del catálogo con su estado para el usuario actual. */
export type BadgeEstado = Badge & {
  desbloqueada: boolean;
  obtenidaEn: string | null;
};

/** Fila del top (schema `RankingPosicion`). */
export interface RankingPosicion {
  posicion: number;
  puntos: RankingPuntos;
  nombre: string | null;
  nombreUsuario: string | null;
  fotoPerfilUrl: string | null;
}

/** Movimiento de puntos (schema `PointTransaction`). */
export interface PointTransaction {
  id: string;
  userId: string;
  tipoAccion: string;
  categoria: string;
  puntos: number;
  descripcion: string | null;
  referenciaTipo: string | null;
  referenciaId: string | null;
  createdAt: string | null;
}

/** Emoji de cada rango, el mismo orden que usa el backend (10 niveles por rango). */
export const RANGO_EMOJI: Record<string, string> = {
  BRONCE: '🥉',
  PLATA: '🥈',
  ORO: '🥇',
  PLATINO: '💎',
  DIAMANTE: '🚀',
};

/** Color de cada rango para la barra y las pastillas. */
export const RANGO_COLOR: Record<string, string> = {
  BRONCE: '#cd7f32',
  PLATA: '#c0c0c0',
  ORO: '#ffd700',
  PLATINO: '#e5e4e2',
  DIAMANTE: '#b9f2ff',
};

export function rangoEmoji(rango?: string | null): string {
  return RANGO_EMOJI[(rango ?? '').toUpperCase()] ?? '🥉';
}

export function rangoColor(rango?: string | null): string {
  return RANGO_COLOR[(rango ?? '').toUpperCase()] ?? '#cd7f32';
}

export function rangoNombre(rango?: string | null): string {
  const value = (rango ?? '').trim();
  if (!value) return '';
  return value.charAt(0) + value.slice(1).toLowerCase();
}
