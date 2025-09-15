// Типы для Sketchfab API

export interface SketchfabUser {
  displayName: string;
  username: string;
  profileUrl: string;
}

export interface SketchfabThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface SketchfabThumbnails {
  images: SketchfabThumbnail[];
}

export interface SketchfabModel {
  uid: string;
  name: string;
  description: string;
  user: SketchfabUser;
  likeCount: number;
  viewCount: number;
  downloadCount: number;
  thumbnails: SketchfabThumbnails;
  createdAt: string;
  publishedAt: string;
  tags: Array<{
    slug: string;
    name: string;
  }>;
  categories: Array<{
    slug: string;
    name: string;
  }>;
  isDownloadable: boolean;
  formats: Array<{
    formatType: string;
    formatId: string;
    formatSize: number;
  }>;
  viewerFeatures: string[];
  embedUrl: string;
  viewerUrl: string;
}

export interface SketchfabSearchResponse {
  results: SketchfabModel[];
  next: string | null;
  previous: string | null;
  count: number;
  totalCount: number;
}

export interface SketchfabSearchParams {
  q?: string;
  cursor?: string;
  count?: number;
}

export interface SketchfabSearchState {
  query: string;
  items: SketchfabModel[];
  nextUrl: string | null;
  loading: boolean;
  error: string | null;
  opened: SketchfabModel | null;
}
