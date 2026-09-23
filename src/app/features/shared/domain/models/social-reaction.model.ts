export type TipoReaccion = 'LIKE' | 'LOVE' | 'CELEBRATE' | 'SUPPORT';

export interface SocialReaction {
  id: string;
  usuarioId: string;
  objetivoId: string;
  tipoObjetivo: string;
  tipoReaccion: TipoReaccion;
  createdAt?: string;
}
