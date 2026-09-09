import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      nombre
      nombreUsuario
      email
      fotoPerfilUrl
      bannerUrl
      roles
      rolActivo
      estadoCuenta
      emailVerificado
      seguidoresCount
      siguiendoCount
      conexionesCount
      createdAt
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $nombre: String, $nombreUsuario: String, $email: String, $fotoPerfilUrl: String, $bannerUrl: String) {
    updateUser(id: $id, nombre: $nombre, nombreUsuario: $nombreUsuario, email: $email, fotoPerfilUrl: $fotoPerfilUrl, bannerUrl: $bannerUrl) {
      id
      nombre
      nombreUsuario
      email
      fotoPerfilUrl
      bannerUrl
      roles
      rolActivo
      estadoCuenta
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        nombre
        nombreUsuario
        email
        roles
        rolActivo
      }
    }
  }
`;

export interface User {
  id: string;
  nombre: string;
  nombreUsuario: string;
  email: string;
  fotoPerfilUrl?: string;
  bannerUrl?: string;
  roles: string[];
  rolActivo: string;
  estadoCuenta: string;
  emailVerificado: boolean;
  seguidoresCount?: number;
  siguiendoCount?: number;
  conexionesCount?: number;
  createdAt?: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class GraphQLService {
  constructor(private apollo: Apollo) {}

  getUser(id: string): Observable<any> {
    return this.apollo.watchQuery<any>({
      query: GET_USER,
      variables: { id },
    }).valueChanges.pipe(map(result => result.data?.user ?? null));
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_USER,
      variables: { id, ...data },
    }).pipe(map(result => result.data?.updateUser));
  }

  login(email: string, password: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: LOGIN,
      variables: { email, password },
    }).pipe(map(result => result.data?.login));
  }
}
