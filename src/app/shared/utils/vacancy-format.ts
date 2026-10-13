/**
 * Etiquetas y formateo de vacantes, compartidos entre la lista "Mis ofertas"
 * y la página pública de empresa.
 *
 * <p>Las funciones reciben valores sueltos en vez de `Vacancy` para no acoplar
 * este módulo compartido al módulo de ofertas.
 */

export const ESTADO_LABELS: Record<string, string> = {
  ACTIVA: 'Activa',
  PAUSADA: 'Pausada',
  CERRADA: 'Cerrada',
  VENCIDA: 'Vencida',
};

export const ESTADO_CLASES: Record<string, string> = {
  ACTIVA: 'active',
  PAUSADA: 'paused',
  CERRADA: 'closed',
  VENCIDA: 'expired',
};

export const CONTRATO_LABELS: Record<string, string> = {
  TIEMPO_COMPLETO: 'Tiempo completo',
  MEDIO_TIEMPO: 'Medio tiempo',
  POR_PROYECTO: 'Por proyecto',
  FREELANCE: 'Freelance',
  PRACTICAS: 'Prácticas',
};

export const MODALIDAD_LABELS: Record<string, string> = {
  REMOTO: 'Remoto',
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
};

/** Forma mínima de la remuneración; `Vacancy.remuneracion` encaja sin importarla. */
export interface RemuneracionResumen {
  visible: boolean | null;
  moneda: string | null;
  minimo: number | null;
  maximo: number | null;
}

export function formatSalario(remuneracion: RemuneracionResumen | null): string | null {
  if (!remuneracion || remuneracion.visible === false) return null;

  const { moneda, minimo, maximo } = remuneracion;
  const fmt = (value: number) => new Intl.NumberFormat('es-PE').format(value);

  if (minimo != null && maximo != null) {
    return `${moneda ?? ''} ${fmt(minimo)} - ${fmt(maximo)}`;
  }

  const single = minimo ?? maximo;
  return single != null ? `${moneda ?? ''} ${fmt(single)}` : null;
}

/** "hace 3 días" / "en 5 días" a partir de una fecha ISO. */
export function relativeTime(iso: string | null): string | null {
  if (!iso) return null;

  const target = Date.parse(iso);
  if (Number.isNaN(target)) return null;

  const days = Math.round((target - Date.now()) / 86_400_000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days === -1) return 'ayer';

  return days > 0 ? `en ${days} días` : `hace ${Math.abs(days)} días`;
}

/** Iniciales de un nombre, para el fallback cuando no hay logo. */
export function inicialesDe(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
