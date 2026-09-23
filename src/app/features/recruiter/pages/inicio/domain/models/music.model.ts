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
