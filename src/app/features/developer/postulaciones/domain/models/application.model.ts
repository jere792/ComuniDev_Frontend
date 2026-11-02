/** Postulación de un developer a una vacante (schema `Application`). */
export interface Application {
  id: string;
  vacancyId: string;
  developerId: string;
  cartaPresentacion: string | null;
  /** ENVIADA | EN_REVISION | PRESELECCIONADA | ENTREVISTA | RECHAZADA | ACEPTADA | RETIRADA */
  estado: string;
  reclutadorAsignadoId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** La vacante ya resuelta: así la lista baja título y empresa sin otra petición. */
  vacancy: ApplicationVacancy | null;
}

/** Lo mínimo de la vacante que necesita "Mis postulaciones" y el botón de detalle. */
export interface ApplicationVacancy {
  id: string;
  titulo: string;
  estado: string | null;
  fechaLimite: string | null;
  company: { nombre: string; logoUrl: string | null } | null;
}

/** Estado que el developer aún puede retirar (RETIRADA es el final del flujo). */
export function esActiva(estado: string): boolean {
  return !!estado && estado !== 'RETIRADA';
}

/** Etiqueta en español de cada estado, igual que lo compara la app móvil. */
export const ESTADO_LABELS: Record<string, string> = {
  ENVIADA: 'Enviada',
  EN_REVISION: 'En revisión',
  PRESELECCIONADA: 'Preseleccionada',
  ENTREVISTA: 'Entrevista',
  RECHAZADA: 'Rechazada',
  ACEPTADA: 'Aceptada',
  RETIRADA: 'Retirada',
};

/** Clase CSS del pill de estado (una por color). */
export const ESTADO_CLASES: Record<string, string> = {
  ENVIADA: 'estado-enviada',
  EN_REVISION: 'estado-revision',
  PRESELECCIONADA: 'estado-preseleccionada',
  ENTREVISTA: 'estado-entrevista',
  RECHAZADA: 'estado-rechazada',
  ACEPTADA: 'estado-aceptada',
  RETIRADA: 'estado-retirada',
};
