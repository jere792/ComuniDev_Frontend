import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RecruiterProfile } from '../../../../../core/domain/models/user.model';
import {
  RecruiterProfileRepository,
  CreateRecruiterProfileRequest,
  UpdateRecruiterProfileRequest,
} from '../../domain/ports/recruiter-profile.repository';

const GET_RECRUITER_PROFILE_BY_USER = gql`
  query GetRecruiterProfileByUser($userId: ID!) {
    recruiterProfileByUserId(userId: $userId) {
      id
      userId
      cargo
      ruc
      lema
      anioCreacion
      modalidadTrabajo
      redesSociales { linkedin instagram tiktok facebook }
      empresas { companyId cargoEnEmpresa activo }
      verificado
    }
  }
`;

const CREATE_RECRUITER_PROFILE = gql`
  mutation CreateRecruiterProfile(
    $userId: String!
    $cargo: String
    $ruc: String
    $lema: String
    $anioCreacion: Int
    $modalidadTrabajo: ModalidadTrabajo
    $redesSociales: RedesSocialesInput
  ) {
    createRecruiterProfile(
      userId: $userId
      cargo: $cargo
      ruc: $ruc
      lema: $lema
      anioCreacion: $anioCreacion
      modalidadTrabajo: $modalidadTrabajo
      redesSociales: $redesSociales
    ) {
      id
      userId
      cargo
      ruc
      lema
      anioCreacion
      modalidadTrabajo
      redesSociales { linkedin instagram tiktok facebook }
    }
  }
`;

const UPDATE_RECRUITER_PROFILE = gql`
  mutation UpdateRecruiterProfile(
    $id: ID!
    $cargo: String
    $ruc: String
    $lema: String
    $anioCreacion: Int
    $modalidadTrabajo: ModalidadTrabajo
    $redesSociales: RedesSocialesInput
  ) {
    updateRecruiterProfile(
      id: $id
      cargo: $cargo
      ruc: $ruc
      lema: $lema
      anioCreacion: $anioCreacion
      modalidadTrabajo: $modalidadTrabajo
      redesSociales: $redesSociales
    ) {
      id
      userId
      cargo
      ruc
      lema
      anioCreacion
      modalidadTrabajo
      redesSociales { linkedin instagram tiktok facebook }
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class RecruiterProfileGraphqlService implements RecruiterProfileRepository {
  constructor(private apollo: Apollo) {}

  getByUserId(userId: string): Observable<RecruiterProfile | null> {
    return this.apollo
      .watchQuery<any>({ query: GET_RECRUITER_PROFILE_BY_USER, variables: { userId } })
      .valueChanges.pipe(map(result => result.data?.recruiterProfileByUserId ?? null));
  }

  create(data: CreateRecruiterProfileRequest): Observable<RecruiterProfile> {
    return this.apollo
      .mutate<any>({ mutation: CREATE_RECRUITER_PROFILE, variables: data })
      .pipe(map(result => result.data?.createRecruiterProfile));
  }

  update(id: string, data: UpdateRecruiterProfileRequest): Observable<RecruiterProfile> {
    return this.apollo
      .mutate<any>({ mutation: UPDATE_RECRUITER_PROFILE, variables: { id, ...data } })
      .pipe(map(result => result.data?.updateRecruiterProfile));
  }
}
