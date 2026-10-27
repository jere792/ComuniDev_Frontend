import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UploadedFile {
  url: string;
  /** El backend nuevo ya devuelve https; el campo viejo era http (secure_url manda). */
  secure_url?: string;
}

/**
 * Sube un archivo al backend (`POST /upload`), que lo manda a Cloudinary y
 * devuelve la URL pública.
 *
 * <p>El endpoint no pertenece a ninguna entidad en particular, así que vive
 * aquí y no dentro de un módulo: lo usan el perfil de usuario y la empresa.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);

  uploadFile(file: File): Observable<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadedFile>(`${environment.apiUrl}/upload`, formData)
      .pipe(map(res => ({ url: res.secure_url ?? res.url })));
  }
}
