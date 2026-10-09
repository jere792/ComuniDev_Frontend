export interface StoryCategory {
  id: string;
  userId: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  orden?: number;
  activa?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
