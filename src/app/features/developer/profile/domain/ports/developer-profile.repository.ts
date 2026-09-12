import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { DeveloperProfile } from '../../../../../core/domain/models/user.model';

export interface DeveloperProfileRepository {
  getByUserId(userId: string): Observable<DeveloperProfile | null>;
  create(data: CreateDeveloperProfileRequest): Observable<DeveloperProfile>;
  update(id: string, data: UpdateDeveloperProfileRequest): Observable<DeveloperProfile>;
}

export interface CreateDeveloperProfileRequest {
  userId: string;
  tituloProfesional?: string;
  tecnologias?: { nombre: string; nivel: string; aniosExperiencia: number }[];
  habilidadesBlandas?: string[];
  disponibilidadLaboral?: { buscandoEmpleo: boolean; modalidades: string[]; tiposContrato: string[] };
  enlaces?: { github?: string; linkedin?: string; portafolio?: string };
}

export interface UpdateDeveloperProfileRequest {
  tituloProfesional?: string;
  tecnologias?: { nombre: string; nivel: string; aniosExperiencia: number }[];
  habilidadesBlandas?: string[];
  disponibilidadLaboral?: { buscandoEmpleo: boolean; modalidades: string[]; tiposContrato: string[] };
  enlaces?: { github?: string; linkedin?: string; portafolio?: string };
}

export const DEVELOPER_PROFILE_REPOSITORY = new InjectionToken<DeveloperProfileRepository>('DeveloperProfileRepository');
