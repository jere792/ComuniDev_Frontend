import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Apollo, gql } from 'apollo-angular';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import {
  ContenidoPreview,
  ReportEstado,
  Reporte,
} from '@features/moderator/feature/reports/domain/models/report.model';
import {
  ReportRepository,
  ResolverReporteInput,
} from '@features/moderator/feature/reports/domain/ports/report.repository';

/** Envoltorio estándar del backend: `{ success, message, data }`. */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const PREVIEW_POST = gql`
  query ReportPreviewPost($id: ID!) {
    post(id: $id) {
      autorId
      contenido {
        texto
      }
    }
  }
`;

const PREVIEW_REEL = gql`
  query ReportPreviewReel($id: ID!) {
    reel(id: $id) {
      autorId
      descripcion
    }
  }
`;

const PREVIEW_COMMENT = gql`
  query ReportPreviewComment($id: ID!) {
    comment(id: $id) {
      autorId
      texto
    }
  }
`;

const PREVIEW_USER = gql`
  query ReportPreviewUser($id: ID!) {
    user(id: $id) {
      id
      nombre
      nombreUsuario
    }
  }
`;

/**
 * Cola de reportes por REST (`/api/v1/reports`), mismo patrón que
 * `core/services/report.service.ts`. El backend siempre envuelve la respuesta
 * en `ApiResponse`, así que se desenvuelve en `data`.
 *
 * La vista previa del contenido reportado es opcional y va por GraphQL
 * (`post(id)` / `reel(id)` / `comment(id)` / `user(id)`), que solo se pide al
 * moderador expandir la fila.
 */
@Injectable({ providedIn: 'root' })
export class ReportHttpService implements ReportRepository {
  private http = inject(HttpClient);
  private apollo = inject(Apollo);

  private readonly API = `${environment.apiUrl}/reports`;

  listar(estado: ReportEstado, page = 0, size = 25): Observable<Reporte[]> {
    const params = new HttpParams()
      .set('estado', estado)
      .set('page', page)
      .set('size', size);

    return this.http
      .get<ApiResponse<Reporte[]>>(this.API, { params })
      .pipe(map((res) => (Array.isArray(res?.data) ? res.data : [])));
  }

  resolver(id: string, input: ResolverReporteInput): Observable<Reporte | null> {
    return this.http
      .post<ApiResponse<Reporte>>(`${this.API}/${id}/resolve`, {
        accion: input.accion,
        moderadorId: input.moderadorId,
        notas: input.notas?.trim() ? input.notas.trim() : null,
      })
      .pipe(map((res) => res?.data ?? null));
  }

  /** Vista previa corta del contenido reportado; null si no existe o no aplica. */
  preview(targetType: string, targetId: string): Observable<ContenidoPreview | null> {
    const tipo = (targetType ?? '').trim().toUpperCase();
    const id = (targetId ?? '').trim();
    if (!id) return of(null);

    switch (tipo) {
      case 'POST':
        return this.apollo
          .query<{ post: { autorId?: string; contenido?: { texto?: string } | null } | null }>({
            query: PREVIEW_POST,
            variables: { id },
            fetchPolicy: 'network-only',
          })
          .pipe(
            map((res) => {
              const post = res.data?.post;
              if (!post) return null;
              return { autorId: post.autorId ?? null, texto: post.contenido?.texto ?? null };
            }),
            catchError(() => of(null)),
          );

      case 'REEL':
        return this.apollo
          .query<{ reel: { autorId?: string; descripcion?: string | null } | null }>({
            query: PREVIEW_REEL,
            variables: { id },
            fetchPolicy: 'network-only',
          })
          .pipe(
            map((res) => {
              const reel = res.data?.reel;
              if (!reel) return null;
              return { autorId: reel.autorId ?? null, texto: reel.descripcion ?? null };
            }),
            catchError(() => of(null)),
          );

      case 'COMMENT':
        return this.apollo
          .query<{ comment: { autorId?: string; texto?: string | null } | null }>({
            query: PREVIEW_COMMENT,
            variables: { id },
            fetchPolicy: 'network-only',
          })
          .pipe(
            map((res) => {
              const comment = res.data?.comment;
              if (!comment) return null;
              return { autorId: comment.autorId ?? null, texto: comment.texto ?? null };
            }),
            catchError(() => of(null)),
          );

      case 'USER':
        return this.apollo
          .query<{ user: { id?: string; nombre?: string; nombreUsuario?: string } | null }>({
            query: PREVIEW_USER,
            variables: { id },
            fetchPolicy: 'network-only',
          })
          .pipe(
            map((res) => {
              const user = res.data?.user;
              if (!user) return null;
              const handle = user.nombreUsuario ? `@${user.nombreUsuario}` : '';
              const nombre = user.nombre ?? '';
              const texto = [nombre, handle].filter(Boolean).join(' ');
              // el perfil del usuario reportado se enlaza con su propio id
              return { autorId: null, texto: texto || null };
            }),
            catchError(() => of(null)),
          );

      default:
        return of(null);
    }
  }
}
