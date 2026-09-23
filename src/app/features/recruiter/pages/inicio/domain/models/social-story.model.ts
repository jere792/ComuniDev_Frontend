export interface SocialStory {
  id: string;
  autorId: string;
  contenido?: {
    texto?: string;
    imagenUrl?: string;
    videoUrl?: string;
    musica?: {
      trackId?: string;
      trackName?: string;
      artistName?: string;
      coverUrl?: string;
      previewUrl?: string;
      musicMode?: string;
      lyricsText?: string;
      lyricsPosX?: number;
      lyricsPosY?: number;
      coverPosX?: number;
      coverPosY?: number;
      lyricsScale?: number;
      coverScale?: number;
    };
  };
  visibilidad?: string;
  fechaExpiracion?: string;
  vistasCount?: number;
  reaccionesCount?: number;
  estado?: string;
  createdAt?: string;
}

export interface SocialStoryView {
  id: string;
  storyId: string;
  viewerId: string;
  viewedAt?: string;
}
