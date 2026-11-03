/** Reto diario, schema `Challenge`. */
export interface Challenge {
  id: string;
  titulo: string;
  enunciado: string;
  /** JAVA | PYTHON | JAVASCRIPT | GENERAL */
  lenguaje: string | null;
  /** TEORICO | CODIGO */
  tipo: string;
  /** Solo TEORICO: textos de las opciones en orden. */
  opciones: string[] | null;
  /** Solo TEORICO; null hasta que el usuario responde (el backend lo oculta). */
  respuestaCorrecta: number | null;
  codigoInicial: string | null;
  /** Solo CODIGO; se expone solo tras responder. */
  solucionReferencia: string | null;
  /** Se expone solo tras responder. */
  explicacion: string | null;
  /** FACIL | MEDIO | DIFICIL */
  dificultad: string | null;
  etiquetas: string[] | null;
  fecha: string | null;
}

/** Respuesta de un usuario a un reto, schema `ChallengeSubmission`. */
export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  /** El reto resuelto (con solución incluida al ya haber respondido). */
  challenge: Challenge | null;
  userId: string;
  /** Opción elegida, índice 0-based (solo TEORICO). */
  respuesta: number | null;
  codigo: string | null;
  /** CORRECTA | INCORRECTA | PARCIAL | SIN_IA */
  estado: string;
  /** Corrección estática, comentario de la IA o instrucción de autoevaluación. */
  feedback: string | null;
  /** +2 por responder y +3 extra si quedó CORRECTA. */
  puntosOtorgados: number | null;
  /** ESTATICA | IA | NINGUNO */
  validadoPor: string | null;
  createdAt: string | null;
}

/** Estado del resultado con su emoji, etiqueta y clase CSS. */
export const ESTADO_META: Record<string, { label: string; emoji: string; clase: string }> = {
  CORRECTA: { label: 'Correcta', emoji: '✅', clase: 'estado-correcta' },
  INCORRECTA: { label: 'Incorrecta', emoji: '❌', clase: 'estado-incorrecta' },
  PARCIAL: { label: 'Parcial', emoji: '🟡', clase: 'estado-parcial' },
  SIN_IA: { label: 'Autoevaluado', emoji: '🔍', clase: 'estado-sin-ia' },
};

export const DIFICULTADES: Record<string, string> = {
  FACIL: 'Fácil',
  MEDIO: 'Medio',
  DIFICIL: 'Difícil',
};

export function estadoMeta(estado?: string | null): { label: string; emoji: string; clase: string } {
  return ESTADO_META[(estado ?? '').toUpperCase()] ?? { label: estado ?? '', emoji: '•', clase: '' };
}

export function dificultadLabel(dificultad?: string | null): string {
  const value = (dificultad ?? '').toUpperCase();
  return DIFICULTADES[value] ?? dificultad ?? '';
}

/** Letra de la opción i-ésima (0 -> A). */
export function letraOpcion(indice: number): string {
  return String.fromCharCode(65 + indice);
}
