export interface CompanyUbicacion {
  pais: string | null;
  ciudad: string | null;
  distrito: string | null;
  direccion: string | null;
}

export interface CompanyContacto {
  email: string | null;
  telefono: string | null;
}

export interface CompanyRedes {
  linkedin: string | null;
  github: string | null;
}

/** Empresa que administra el reclutador (schema `Company`). */
export interface Company {
  id: string;
  nombre: string;
  descripcion: string | null;
  sector: string | null;
  sitioWeb: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  ubicacion: CompanyUbicacion | null;
  contacto: CompanyContacto | null;
  redes: CompanyRedes | null;
  estadoVerificacion: string | null;
  vacantesActivasCount: number | null;
}

/** Lo mínimo que necesita quien junta empresas con otras entidades (ofertas, tarjetas). */
export interface CompanyOption {
  id: string;
  nombre: string;
  logoUrl: string | null;
  sector: string | null;
}

/** Petición de `createCompany` / `updateCompany`: todos los campos son opcionales. */
export interface CompanyInput {
  nombre: string;
  descripcion?: string;
  sector?: string;
  sitioWeb?: string;
  logoUrl?: string;
  bannerUrl?: string;
  ubicacion?: CompanyUbicacion;
  contacto?: CompanyContacto;
  redes?: CompanyRedes;
}
