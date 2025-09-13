export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  source: 'local' | 'cloud';
  url: string;
  genre?: string;
  year?: number;
  album?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  description?: string;
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  currentIndex: number;
  playlist: Track[];
}

export interface SearchFilters {
  genre?: string;
  source?: 'local' | 'cloud' | 'all';
  year?: number;
}
