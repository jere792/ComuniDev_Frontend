import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LyricsResponse, MusicTrackResponse } from '@features/recruiter/pages/inicio/domain/models/music.model';
import { MusicaRepository } from '@features/recruiter/pages/inicio/domain/ports/musica.repository';

@Injectable({ providedIn: 'root' })
export class MusicaHttpService implements MusicaRepository {
  private http = inject(HttpClient);

  private readonly API = '/api/v1/musica';

  buscar(query: string): Observable<MusicTrackResponse[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<MusicTrackResponse[]>(`${this.API}/search`, { params });
  }

  fetchLyrics(artist: string, track: string): Observable<LyricsResponse | null> {
    const params = new HttpParams()
      .set('artist', artist)
      .set('track', track);
    return this.http.get<LyricsResponse>(`${this.API}/lyrics`, { params });
  }
}
