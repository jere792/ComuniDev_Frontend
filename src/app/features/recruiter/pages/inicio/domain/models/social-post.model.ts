export interface SocialPost {
  id: string;
  autorId: string;
  tipo: string;
  contenido?: { texto?: string; imagenes?: string[] };
  etiquetas?: string[];
  categoria?: string;
  visibilidad?: string;
  estadoModeracion?: string;
  estadisticas?: { vistas?: number; reaccionesCount?: number; comentariosCount?: number; compartidosCount?: number; guardadosCount?: number };
  createdAt?: string;
  updatedAt?: string;
}
