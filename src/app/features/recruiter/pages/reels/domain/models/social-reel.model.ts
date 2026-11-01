export interface SocialReel {
  id: string;
  autorId: string;
  videoUrl: string;
  portadaUrl?: string;
  descripcion?: string;
  etiquetas?: string[];
  /** Personas etiquetadas en el reel (ids de usuario); solo conexiones o seguidos del autor */
  etiquetados?: string[];
  musica?: { titulo?: string; artista?: string };
  duracionSegundos?: number;
  visibilidad?: string;
  estadoModeracion?: string;
  estadisticas?: { vistas?: number; reaccionesCount?: number; comentariosCount?: number; compartidosCount?: number; guardadosCount?: number };
  createdAt?: string;
}
