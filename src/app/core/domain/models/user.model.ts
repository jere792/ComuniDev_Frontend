export interface User {
  id: string;
  nombre: string;
  nombreUsuario: string;
  email: string;
  telefono?: string;
  fotoPerfilUrl?: string;
  bannerUrl?: string;
  bio?: string;
  ubicacion?: Ubicacion;
  roles: string[];
  rolActivo: string;
  estadoCuenta: string;
  emailVerificado: boolean;
  seguidoresCount?: number;
  siguiendoCount?: number;
  conexionesCount?: number;
  createdAt?: string;
  estadoActividad?: EstadoActividad;
  developerProfile?: DeveloperProfile;
  recruiterProfile?: RecruiterProfile;
}

export interface EstadoActividad {
  estado: string;
  mensajePersonalizado?: string;
  ultimaVez?: string;
}

export interface Ubicacion {
  pais: string;
  ciudad: string;
  distrito: string;
}

export interface DeveloperProfile {
  id: string;
  userId: string;
  tituloProfesional?: string;
  tecnologias?: Tecnologia[];
  habilidadesBlandas?: string[];
  experiencias?: Experiencia[];
  educacion?: Educacion[];
  certificados?: Certificado[];
  proyectos?: Proyecto[];
  cv?: CV;
  disponibilidadLaboral?: DisponibilidadLaboral;
  enlaces?: EnlacesDeveloper;
}

export interface Tecnologia {
  nombre: string;
  nivel: string;
  aniosExperiencia: number;
}

export interface Experiencia {
  empresa: string;
  cargo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin?: string;
}

export interface Educacion {
  institucion: string;
  titulo: string;
  fechaInicio: string;
  fechaFin?: string;
}

export interface Certificado {
  nombre: string;
  institucion: string;
  fechaObtencion: string;
  url?: string;
}

export interface Proyecto {
  nombre: string;
  descripcion: string;
  url?: string;
  tecnologias: string[];
}

export interface CV {
  archivoUrl?: string;
  nombreArchivo?: string;
  actualizadoEn?: string;
}

export interface DisponibilidadLaboral {
  buscandoEmpleo: boolean;
  modalidades: string[];
  tiposContrato: string[];
}

export interface EnlacesDeveloper {
  github?: string;
  linkedin?: string;
  portafolio?: string;
}

export interface RecruiterProfile {
  id: string;
  userId: string;
  cargo?: string;
  ruc?: string;
  lema?: string;
  anioCreacion?: number;
  modalidadTrabajo?: string;
  redesSociales?: RedesSociales;
  empresas?: EmpresaRecruiter[];
  verificado: boolean;
}

export interface RedesSociales {
  linkedin?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
}

export interface EmpresaRecruiter {
  companyId: string;
  cargoEnEmpresa: string;
  activo: boolean;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface Stats {
  totalUsers: number;
  developers: number;
  recruiters: number;
  admins: number;
  activeUsers: number;
}
