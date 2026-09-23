export interface TecnologiaResponse {
  nombre: string;
  nivel?: string | null;
  aniosExperiencia?: number | null;
}

export interface DisponibilidadLaboral {
  buscandoEmpleo?: boolean | null;
  modalidades?: string[] | null;
  tiposContrato?: string[] | null;
}

export interface ExperienciaResponse {
  cargo?: string | null;
  empresa?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  descripcion?: string | null;
}

export interface DeveloperProfile {
  id: string;
  nombre: string;
  nombreUsuario?: string | null;
  fotoPerfilUrl?: string | null;
  tituloProfesional?: string | null;
  bio?: string | null;
  ubicacionPais?: string | null;
  ubicacionCiudad?: string | null;
  tecnologias?: TecnologiaResponse[] | null;
  habilidadesBlandas?: string[] | null;
  disponibilidadLaboral?: DisponibilidadLaboral | null;
  remoto?: boolean | null;
  experiencias?: ExperienciaResponse[] | null;
}

export interface TalentSearchFilters {
  technologies?: string[];
  experienceLevel?: string;
  locationCountry?: string;
  locationCity?: string;
  remoteAvailable?: boolean;
  availability?: string;
  previousExperience?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  size?: number;
}

export interface TalentSearchResult {
  developers: DeveloperProfile[];
  total: number;
  page: number;
  size: number;
}

export interface SavedProfile {
  id: string;
  recruiterId: string;
  developerId: string;
  notes?: string | null;
  savedAt?: string | null;
}
