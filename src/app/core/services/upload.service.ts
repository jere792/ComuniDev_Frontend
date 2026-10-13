import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadedFile {
  url: string;
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
    return this.http.post<UploadedFile>(`${environment.apiUrl}/upload`, formData);
  }
}
