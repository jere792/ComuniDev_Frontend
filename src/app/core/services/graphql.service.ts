import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const GET_USER = gql`
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
      sitioWeb
      ubicacion { pais departamento provincia ciudad distrito direccion }
      roles
      rolActivo
      estadoCuenta
      emailVerificado
      seguidoresCount
      siguiendoCount
      conexionesCount
      createdAt
      developerProfile {
        id
        tituloProfesional
        tecnologias { nombre nivel aniosExperiencia }
        habilidadesBlandas
        experiencias { empresa cargo descripcion fechaInicio fechaFin }
        educacion { institucion titulo fechaInicio fechaFin }
        certificados { nombre institucion fechaObtencion url }
        proyectos { nombre descripcion url tecnologias }
        cv { archivoUrl nombreArchivo actualizadoEn }
        disponibilidadLaboral { buscandoEmpleo modalidades tiposContrato }
        enlaces { github linkedin portafolio }
      }
      recruiterProfile {
        id
        cargo
        ruc
        lema
        fechaCreacion
        modalidadTrabajo
        redesSociales { linkedin instagram tiktok facebook }
        empresas { companyId cargoEnEmpresa activo }
        verificado
      }
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $nombre: String, $nombreUsuario: String, $email: String, $telefono: String, $fotoPerfilUrl: String, $bannerUrl: String, $bio: String, $sitioWeb: String, $ubicacion: UserUbicacionInput) {
    updateUser(id: $id, nombre: $nombre, nombreUsuario: $nombreUsuario, email: $email, telefono: $telefono, fotoPerfilUrl: $fotoPerfilUrl, bannerUrl: $bannerUrl, bio: $bio, sitioWeb: $sitioWeb, ubicacion: $ubicacion) {
      id
      nombre
      nombreUsuario
      email
      telefono
      fotoPerfilUrl
      bannerUrl
      bio
      sitioWeb
      ubicacion { pais departamento provincia ciudad distrito direccion }
      roles
      rolActivo
      estadoCuenta
    }
  }
`;

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

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($userId: ID!, $currentPassword: String!, $newPassword: String!) {
    changePassword(userId: $userId, currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

const UPDATE_NOTIFICATION_PREFERENCES = gql`
  mutation UpdateNotificationPreferences($userId: ID!, $preferences: NotificationPreferencesInput!) {
    updateNotificationPreferences(userId: $userId, preferences: $preferences) {
      id
      configuracion {
        notificaciones {
          email
          push
          mensajes
          comentarios
          reacciones
          conexiones
          vacantes
        }
      }
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
    }
  }
`;

const CREATE_RECRUITER_PROFILE = gql`
  mutation CreateRecruiterProfile(
    $userId: String!
    $cargo: String
    $ruc: String
    $lema: String
    $empresasDescripcion: String
    $fechaCreacion: String
    $modalidadTrabajo: ModalidadTrabajo
    $redesSociales: RedesSocialesInput
  ) {
    createRecruiterProfile(
      userId: $userId
      cargo: $cargo
      ruc: $ruc
      lema: $lema
      empresasDescripcion: $empresasDescripcion
      fechaCreacion: $fechaCreacion
      modalidadTrabajo: $modalidadTrabajo
      redesSociales: $redesSociales
    ) {
      id
      userId
      cargo
      ruc
      lema
      empresasDescripcion
      fechaCreacion
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
    $empresasDescripcion: String
    $fechaCreacion: String
    $modalidadTrabajo: ModalidadTrabajo
    $redesSociales: RedesSocialesInput
  ) {
    updateRecruiterProfile(
      id: $id
      cargo: $cargo
      ruc: $ruc
      lema: $lema
      empresasDescripcion: $empresasDescripcion
      fechaCreacion: $fechaCreacion
      modalidadTrabajo: $modalidadTrabajo
      redesSociales: $redesSociales
    ) {
      id
      userId
      cargo
      ruc
      lema
      empresasDescripcion
      fechaCreacion
      modalidadTrabajo
      redesSociales { linkedin instagram tiktok facebook }
    }
  }
`;

export interface DeveloperProfileData {
  id: string;
  userId: string;
  tituloProfesional?: string;
  tecnologias?: { nombre: string; nivel: string; aniosExperiencia: number }[];
  habilidadesBlandas?: string[];
  experiencias?: { empresa: string; cargo: string; descripcion: string; fechaInicio: string; fechaFin?: string }[];
  educacion?: { institucion: string; titulo: string; fechaInicio: string; fechaFin?: string }[];
  certificados?: { nombre: string; institucion: string; fechaObtencion: string; url?: string }[];
  proyectos?: { nombre: string; descripcion: string; url?: string; tecnologias: string[] }[];
  cv?: { archivoUrl?: string; nombreArchivo?: string; actualizadoEn?: string };
  disponibilidadLaboral?: { buscandoEmpleo: boolean; modalidades: string[]; tiposContrato: string[] };
  enlaces?: { github?: string; linkedin?: string; portafolio?: string };
}

export interface RecruiterProfileData {
  id: string;
  userId: string;
  cargo?: string;
  ruc?: string;
  lema?: string;
  fechaCreacion?: string;
  modalidadTrabajo?: string;
  redesSociales?: { linkedin?: string; instagram?: string; tiktok?: string; facebook?: string };
  empresas?: { companyId: string; cargoEnEmpresa: string; activo: boolean }[];
  verificado: boolean;
}

export interface User {
  id: string;
  nombre: string;
  nombreUsuario: string;
  email: string;
  telefono?: string;
  fotoPerfilUrl?: string;
  bannerUrl?: string;
  bio?: string;
  sitioWeb?: string;
  ubicacion?: { pais: string; ciudad: string; distrito: string };
  roles: string[];
  rolActivo: string;
  estadoCuenta: string;
  emailVerificado: boolean;
  seguidoresCount?: number;
  siguiendoCount?: number;
  conexionesCount?: number;
  createdAt?: string;
  estadoActividad?: { estado: string; mensajePersonalizado?: string; ultimaVez?: string };
  developerProfile?: DeveloperProfileData;
  recruiterProfile?: RecruiterProfileData;
}

export interface AuthPayload {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class GraphQLService {
  constructor(private apollo: Apollo, private http: HttpClient) {}

  getUser(id: string): Observable<any> {
    return this.apollo.watchQuery<any>({
      query: GET_USER,
      variables: { id },
    }).valueChanges.pipe(map(result => {
      console.log('GraphQL result:', result);
      if (result.error) {
        console.error('GraphQL error:', result.error);
      }
      return result.data?.user ?? null;
    }));
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_USER,
      variables: { id, ...data },
    }).pipe(map(result => result.data?.updateUser));
  }

  getUsers(): Observable<any> {
    return this.apollo.watchQuery<any>({
      query: GET_USERS,
    }).valueChanges.pipe(map(result => result.data?.users ?? []));
  }

  deleteUser(id: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: DELETE_USER,
      variables: { id },
    }).pipe(map(result => result.data?.deleteUser));
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: CHANGE_PASSWORD,
      variables: { userId, currentPassword, newPassword },
    }).pipe(map(result => result.data?.changePassword));
  }

  updateNotificationPreferences(userId: string, preferences: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_NOTIFICATION_PREFERENCES,
      variables: { userId, preferences },
    }).pipe(map(result => result.data?.updateNotificationPreferences));
  }

  login(email: string, password: string): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: LOGIN,
      variables: { email, password },
    }).pipe(map(result => result.data?.login));
  }

  createDeveloperProfile(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: CREATE_DEVELOPER_PROFILE,
      variables: data,
    }).pipe(map(result => result.data?.createDeveloperProfile));
  }

  updateDeveloperProfile(id: string, data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_DEVELOPER_PROFILE,
      variables: { id, ...data },
    }).pipe(map(result => result.data?.updateDeveloperProfile));
  }

  createRecruiterProfile(data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: CREATE_RECRUITER_PROFILE,
      variables: data,
    }).pipe(map(result => result.data?.createRecruiterProfile));
  }

  updateRecruiterProfile(id: string, data: any): Observable<any> {
    return this.apollo.mutate<any>({
      mutation: UPDATE_RECRUITER_PROFILE,
      variables: { id, ...data },
    }).pipe(map(result => result.data?.updateRecruiterProfile));
  }

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${environment.apiUrl}/upload`, formData);
  }
}
