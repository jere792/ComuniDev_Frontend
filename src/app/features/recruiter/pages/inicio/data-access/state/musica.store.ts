import { Injectable, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LyricsResponse, MusicTrackResponse } from '@features/recruiter/pages/inicio/domain/models/music.model';
import { MUSICA_REPOSITORY, MusicaRepository } from '@features/recruiter/pages/inicio/domain/ports/musica.repository';

@Injectable({ providedIn: 'root' })
export class MusicaStore {
  private repository = inject<MusicaRepository>(MUSICA_REPOSITORY);

  readonly results = signal<MusicTrackResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  search(query: string): Observable<MusicTrackResponse[]> {
    this.loading.set(true);
    this.error.set(null);
    const obs = this.repository.buscar(query);
    obs.subscribe({
      next: (results) => {
        this.results.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al buscar música');
        this.loading.set(false);
      },
    });
    return obs;
  }

  buscar(query: string): Observable<MusicTrackResponse[]> {
    return this.repository.buscar(query);
  }

  fetchLyrics(artist: string, track: string): Observable<LyricsResponse | null> {
    return this.repository.fetchLyrics(artist, track);
  }

  clear(): void {
    this.results.set([]);
    this.error.set(null);
  }
}
