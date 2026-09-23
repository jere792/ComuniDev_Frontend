import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { LyricsResponse, MusicTrackResponse } from '@features/recruiter/pages/inicio/domain/models/music.model';

export interface MusicaRepository {
  buscar(query: string): Observable<MusicTrackResponse[]>;
  fetchLyrics(artist: string, track: string): Observable<LyricsResponse | null>;
}

export const MUSICA_REPOSITORY = new InjectionToken<MusicaRepository>('MusicaRepository');
