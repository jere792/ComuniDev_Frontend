import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { User } from '@core/domain/models/user.model';
import {
  NotificationPreferences,
  UploadResponse,
  UserRepository,
} from '@features/users/domain/ports/user.repository';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      nombre
      nombreUsuario
      email
      fotoPerfilUrl
      bannerUrl
      bio
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

@Injectable({ providedIn: 'root' })
export class UserGraphqlService implements UserRepository {
  private apollo = inject(Apollo);
  private http = inject(HttpClient);


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
      .pipe(map(result => result.data?.deleteUser ?? false));
  }

  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${environment.apiUrl}/upload`, formData);
  }

  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({
        mutation: CHANGE_PASSWORD,
        variables: { userId, currentPassword, newPassword },
      })
      .pipe(map(result => result.data?.changePassword === true));
  }

  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Observable<unknown> {
    return this.apollo
      .mutate<any>({
        mutation: UPDATE_NOTIFICATION_PREFERENCES,
        variables: { userId, preferences },
      })
      .pipe(map(result => result.data?.updateNotificationPreferences));
  }
}
