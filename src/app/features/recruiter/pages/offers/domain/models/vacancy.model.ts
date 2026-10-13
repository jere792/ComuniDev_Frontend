/** Remuneración de una vacante (schema `VacancyRemuneracion`). */
export interface VacancyRemuneracion {
  visible: boolean | null;
  moneda: string | null;
  minimo: number | null;
  maximo: number | null;
  periodo: string | null;
}

/** Vacante tal y como la devuelve `vacanciesByRecruiter`. */
export interface Vacancy {
  id: string;
  companyId: string | null;
  recruiterId: string | null;
  titulo: string;
  descripcion: string | null;
  tecnologias: string[];
  nivelExperiencia: string | null;
  modalidad: string | null;
  tipoContrato: string | null;
  ubicacion: string | null;
  remuneracion: VacancyRemuneracion | null;
  vacantesDisponibles: number | null;
  estado: string | null;
  fechaLimite: string | null;
  destacada: boolean | null;
  postulacionesCount: number | null;
  createdAt: string | null;
}

/** Lo mínimo de la empresa que necesita la tarjeta de oferta. */
export interface CompanySummary {
  nombre: string;
  logoUrl: string | null;
  sector: string | null;
}

/**
 * Vacante lista para mostrar: el backend expone `companyId` (un id), así que
 * los datos de la empresa se resuelven en el cliente contra `companies`.
 */
export interface OfferItem extends Vacancy {
  /** null cuando la oferta la publica un reclutador independiente. */
  company: CompanySummary | null;
}

/** Petición de `createVacancy`. `fechaLimite` va como `YYYY-MM-DD`. */
export interface VacancyInput {
  /** Opcional: un reclutador independiente publica sin empresa. */
  companyId?: string;
  recruiterId: string;
  titulo: string;
  descripcion?: string;
  tecnologias?: string[];
  nivelExperiencia?: string;
  modalidad?: string;
  tipoContrato?: string;
  ubicacion?: string;
  remuneracion?: { moneda: string; minimo?: number; maximo?: number };
  fechaLimite?: string;
}
