import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeveloperProfile } from '../../../../../core/domain/models/user.model';
import {
  DeveloperProfileRepository,
  CreateDeveloperProfileRequest,
  UpdateDeveloperProfileRequest,
} from '../../domain/ports/developer-profile.repository';

const GET_DEVELOPER_PROFILE_BY_USER = gql`
  query GetDeveloperProfileByUser($userId: ID!) {
    developerProfileByUserId(userId: $userId) {
      id
      userId
      tituloProfesional
      tecnologias { nombre nivel aniosExperiencia }
      habilidadesBlandas
      disponibilidadLaboral { buscandoEmpleo modalidades tiposContrato }
      enlaces { github linkedin portafolio }
    }
  }
`;

const CREATE_DEVELOPER_PROFILE = gql`
  mutation CreateDeveloperProfile(
    $userId: String!
    $tituloProfesional: String
    $tecnologias: [TecnologiaInput]
    $habilidadesBlandas: [String]
    $disponibilidadLaboral: DeveloperDisponibilidadInput
    $enlaces: DeveloperEnlacesInput
  ) {
    createDeveloperProfile(
      userId: $userId
      tituloProfesional: $tituloProfesional
      tecnologias: $tecnologias
      habilidadesBlandas: $habilidadesBlandas
      disponibilidadLaboral: $disponibilidadLaboral
      enlaces: $enlaces
    ) {
      id
      userId
      tituloProfesional
      tecnologias { nombre nivel aniosExperiencia }
      habilidadesBlandas
      disponibilidadLaboral { buscandoEmpleo modalidades tiposContrato }
      enlaces { github linkedin portafolio }
    }
  }
`;

const UPDATE_DEVELOPER_PROFILE = gql`
  mutation UpdateDeveloperProfile(
    $id: ID!
    $tituloProfesional: String
    $tecnologias: [TecnologiaInput]
    $habilidadesBlandas: [String]
    $disponibilidadLaboral: DeveloperDisponibilidadInput
    $enlaces: DeveloperEnlacesInput
  ) {
    updateDeveloperProfile(
      id: $id
      tituloProfesional: $tituloProfesional
      tecnologias: $tecnologias
      habilidadesBlandas: $habilidadesBlandas
      disponibilidadLaboral: $disponibilidadLaboral
      enlaces: $enlaces
    ) {
      id
      userId
      tituloProfesional
      tecnologias { nombre nivel aniosExperiencia }
      habilidadesBlandas
      disponibilidadLaboral { buscandoEmpleo modalidades tiposContrato }
      enlaces { github linkedin portafolio }
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class DeveloperProfileGraphqlService implements DeveloperProfileRepository {
  constructor(private apollo: Apollo) {}

  getByUserId(userId: string): Observable<DeveloperProfile | null> {
    return this.apollo
      .watchQuery<any>({ query: GET_DEVELOPER_PROFILE_BY_USER, variables: { userId } })
      .valueChanges.pipe(map(result => result.data?.developerProfileByUserId ?? null));
  }

  create(data: CreateDeveloperProfileRequest): Observable<DeveloperProfile> {
    return this.apollo
      .mutate<any>({ mutation: CREATE_DEVELOPER_PROFILE, variables: data })
      .pipe(map(result => result.data?.createDeveloperProfile));
  }

  update(id: string, data: UpdateDeveloperProfileRequest): Observable<DeveloperProfile> {
    return this.apollo
      .mutate<any>({ mutation: UPDATE_DEVELOPER_PROFILE, variables: { id, ...data } })
      .pipe(map(result => result.data?.updateDeveloperProfile));
  }
}
