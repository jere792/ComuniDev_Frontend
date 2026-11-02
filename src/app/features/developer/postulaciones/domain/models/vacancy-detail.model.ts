/** Remuneración de una vacante (schema `VacancyRemuneracion`). */
export interface VacancyDetailRemuneracion {
  visible: boolean | null;
  moneda: string | null;
  minimo: number | null;
  maximo: number | null;
  periodo: string | null;
}

/** Vacante completa para la página de detalle (schema `Vacancy`). */
export interface VacancyDetail {
  id: string;
  companyId: string | null;
  recruiterId: string | null;
  titulo: string;
  descripcion: string | null;
  responsabilidades: string[];
  requisitos: string[];
  tecnologias: string[];
  nivelExperiencia: string | null;
  modalidad: string | null;
  tipoContrato: string | null;
  ubicacion: string | null;
  remuneracion: VacancyDetailRemuneracion | null;
  vacantesDisponibles: number | null;
  /** ACTIVA | PAUSADA | CERRADA; una vencida deja de recibir postulaciones (RN-21). */
  estado: string | null;
  fechaLimite: string | null;
  destacada: boolean | null;
  postulacionesCount: number | null;
  createdAt: string | null;
  company: { nombre: string; logoUrl: string | null; sector: string | null } | null;
}
