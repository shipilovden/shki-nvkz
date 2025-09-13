export interface Photo {
  id: string;
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  category: string;
}

export interface Video {
  id: string;
  title: string;
  src: string;
  thumbnail: string;
  duration: string;
  description: string;
  category: string;
  createdAt: string;
  views: number;
  isFavorite: boolean;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  photos: Photo[];
  category: string;
  createdAt: string;
  views: number;
  isFavorite: boolean;
}

export type GalleryMode = 'photos' | 'videos';
