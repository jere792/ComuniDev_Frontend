export interface TecnologiaResponse {
  nombre: string;
  nivel?: string | null;
  aniosExperiencia?: number | null;
}

export interface PretensionSalarialResponse {
  moneda?: string | null;
  minimo?: number | null;
  maximo?: number | null;
}

export interface DisponibilidadLaboral {
  buscandoEmpleo?: boolean | null;
  modalidades?: string[] | null;
  tiposContrato?: string[] | null;
  pretensionSalarial?: PretensionSalarialResponse | null;
}

export interface ExperienciaResponse {
  cargo?: string | null;
  empresa?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  descripcion?: string | null;
  actual?: boolean | null;
}

export interface EducacionResponse {
  institucion?: string | null;
  titulo?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  actual?: boolean | null;
}

export interface CertificadoResponse {
  nombre?: string | null;
  institucion?: string | null;
  fechaObtencion?: string | null;
  url?: string | null;
}

export interface ProyectoResponse {
  nombre?: string | null;
  descripcion?: string | null;
  url?: string | null;
  tecnologias?: string[] | null;
}

export interface CvResponse {
  archivoUrl?: string | null;
  nombreArchivo?: string | null;
  actualizadoEn?: string | null;
}

export interface EnlacesResponse {
  github?: string | null;
  linkedin?: string | null;
  portafolio?: string | null;
}

export interface DeveloperProfile {
  id: string;
  nombre: string;
  nombreUsuario?: string | null;
  email?: string | null;
  telefono?: string | null;
  fotoPerfilUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  sitioWeb?: string | null;
  ubicacionPais?: string | null;
  ubicacionDepartamento?: string | null;
  ubicacionCiudad?: string | null;
  estadoCuenta?: string | null;
  createdAt?: string | null;
  seguidoresCount?: number | null;
  siguiendoCount?: number | null;
  conexionesCount?: number | null;
  tituloProfesional?: string | null;
  tecnologias?: TecnologiaResponse[] | null;
  habilidadesBlandas?: string[] | null;
  experiencias?: ExperienciaResponse[] | null;
  educacion?: EducacionResponse[] | null;
  certificados?: CertificadoResponse[] | null;
  proyectos?: ProyectoResponse[] | null;
  cv?: CvResponse | null;
  enlaces?: EnlacesResponse | null;
  disponibilidadLaboral?: DisponibilidadLaboral | null;
  remoto?: boolean | null;
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
