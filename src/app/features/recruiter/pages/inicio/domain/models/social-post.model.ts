/** La vacante que trae una publicación tipo VACANTE: es la que dibuja la tarjeta de la oferta. */
export interface VacanteEmbebida {
  id: string;
  titulo?: string | null;
  modalidad?: string | null;
  ubicacion?: string | null;
  tecnologias?: string[];
  estado?: string | null;
  fechaLimite?: string | null;
  postulacionesCount?: number | null;
  company?: { nombre?: string | null } | null;
}

export interface SocialPost {
  id: string;
  autorId: string;
  tipo: string;
  /** Vacante dentro de la publicación; solo existe cuando tipo === 'VACANTE'. */
  vacanteId?: string | null;
  vacante?: VacanteEmbebida | null;
  contenido?: { texto?: string; imagenes?: string[] };
  etiquetas?: string[];
  categoria?: string;
  visibilidad?: string;
  estadoModeracion?: string;
  estadisticas?: { vistas?: number; reaccionesCount?: number; comentariosCount?: number; compartidosCount?: number; guardadosCount?: number };
  createdAt?: string;
  updatedAt?: string;
}
