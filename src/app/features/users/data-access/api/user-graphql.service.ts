import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../../../../core/domain/models/user.model';
import { UserRepository } from '../../domain/ports/user.repository';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      nombre
      nombreUsuario
      email
      roles
      rolActivo
      estadoCuenta
      emailVerificado
      createdAt
    }
  }
`;

const GET_USER_BY_ID = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      nombre
      nombreUsuario
      email
      telefono
      fotoPerfilUrl
      bannerUrl
      bio
      ubicacion { pais departamento provincia ciudad distrito direccion }
      roles
      rolActivo
      estadoCuenta
      emailVerificado
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $nombre: String, $nombreUsuario: String, $email: String, $telefono: String, $fotoPerfilUrl: String, $bannerUrl: String, $bio: String, $ubicacion: UserUbicacionInput) {
    updateUser(id: $id, nombre: $nombre, nombreUsuario: $nombreUsuario, email: $email, telefono: $telefono, fotoPerfilUrl: $fotoPerfilUrl, bannerUrl: $bannerUrl, bio: $bio, ubicacion: $ubicacion) {
      id
      nombre
      nombreUsuario
      email
      roles
      rolActivo
      estadoCuenta
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

@Injectable({ providedIn: 'root' })
export class UserGraphqlService implements UserRepository {
  constructor(private apollo: Apollo) {}

  getAll(): Observable<User[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_USERS })
      .valueChanges.pipe(map(result => result.data?.users ?? []));
  }

  getById(id: string): Observable<User | null> {
    return this.apollo
      .watchQuery<any>({ query: GET_USER_BY_ID, variables: { id } })
      .valueChanges.pipe(map(result => result.data?.user ?? null));
  }

  update(id: string, data: Partial<User>): Observable<User> {
    return this.apollo
      .mutate<any>({ mutation: UPDATE_USER, variables: { id, ...data } })
      .pipe(map(result => result.data?.updateUser));
  }

  delete(id: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: DELETE_USER, variables: { id } })
      .pipe(map(result => result.data?.deleteUser));
  }
}
