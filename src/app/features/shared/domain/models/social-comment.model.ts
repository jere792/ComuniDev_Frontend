export interface SocialComment {
  id: string;
  autorId: string;
  contenidoId: string;
  tipoContenido: string;
  parentCommentId?: string;
  texto: string;
  imagenes?: string[];
  estadoModeracion?: string;
  reaccionesCount?: number;
  repliesCount?: number;
  createdAt?: string;
}
