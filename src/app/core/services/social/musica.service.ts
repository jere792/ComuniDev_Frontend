import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MusicTrackResponse {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  previewUrl: string;
}

export interface LyricsResponse {
  trackName: string;
  artistName: string;
  plainLyrics: string;
  syncedLyrics: string;
}

@Injectable({ providedIn: 'root' })
export class MusicaService {
  private readonly API = '/api/v1/musica';

  constructor(private http: HttpClient) {}

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
