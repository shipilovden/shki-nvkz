import type { Album, Video } from "@/types/gallery.types";

// Демо альбомы для галереи
export const albums: Album[] = [
  {
    id: "album-1",
    title: "Альбом 1",
    description: "Коллекция фотографий из первого альбома",
    coverImage: "/images/gallery/horizontal-1.jpg",
    category: "Портрет",
    createdAt: "2025-04-20",
    views: 156,
    isFavorite: false,
    photos: [
      {
        id: "photo-1-1",
        title: "Фото 1",
        src: "/images/gallery/horizontal-1.jpg",
        alt: "Фото 1 из альбома 1",
        width: 1920,
        height: 1080,
        category: "Портрет"
      },
      {
        id: "photo-1-2",
        title: "Фото 2",
        src: "/images/gallery/horizontal-2.jpg",
        alt: "Фото 2 из альбома 1",
        width: 1920,
        height: 1080,
        category: "Портрет"
      },
      {
        id: "photo-1-3",
        title: "Фото 3",
        src: "/images/gallery/horizontal-3.jpg",
        alt: "Фото 3 из альбома 1",
        width: 1920,
        height: 1080,
        category: "Портрет"
      },
      {
        id: "photo-1-4",
        title: "Фото 4",
        src: "/images/gallery/horizontal-4.jpg",
        alt: "Фото 4 из альбома 1",
        width: 1920,
        height: 1080,
        category: "Портрет"
      }
    ]
  },
  {
    id: "album-2",
    title: "Альбом 2",
    description: "Коллекция фотографий из второго альбома",
    coverImage: "/images/gallery/vertical-1.jpg",
    category: "Пейзаж",
    createdAt: "2025-04-19",
    views: 89,
    isFavorite: true,
    photos: [
      {
        id: "photo-2-1",
        title: "Фото 1",
        src: "/images/gallery/vertical-1.jpg",
        alt: "Фото 1 из альбома 2",
        width: 1080,
        height: 1920,
        category: "Пейзаж"
      },
      {
        id: "photo-2-2",
        title: "Фото 2",
        src: "/images/gallery/vertical-2.jpg",
        alt: "Фото 2 из альбома 2",
        width: 1080,
        height: 1920,
        category: "Пейзаж"
      },
      {
        id: "photo-2-3",
        title: "Фото 3",
        src: "/images/gallery/vertical-3.jpg",
        alt: "Фото 3 из альбома 2",
        width: 1080,
        height: 1920,
        category: "Пейзаж"
      },
      {
        id: "photo-2-4",
        title: "Фото 4",
        src: "/images/gallery/vertical-4.jpg",
        alt: "Фото 4 из альбома 2",
        width: 1080,
        height: 1920,
        category: "Пейзаж"
      }
    ]
  },
  {
    id: "album-3",
    title: "Альбом 3",
    description: "Коллекция фотографий из третьего альбома",
    coverImage: "/images/gallery/horizontal-2.jpg",
    category: "Архитектура",
    createdAt: "2025-04-18",
    views: 234,
    isFavorite: false,
    photos: [
      {
        id: "photo-3-1",
        title: "Фото 1",
        src: "/images/gallery/horizontal-2.jpg",
        alt: "Фото 1 из альбома 3",
        width: 1920,
        height: 1080,
        category: "Архитектура"
      },
      {
        id: "photo-3-2",
        title: "Фото 2",
        src: "/images/gallery/horizontal-3.jpg",
        alt: "Фото 2 из альбома 3",
        width: 1920,
        height: 1080,
        category: "Архитектура"
      },
      {
        id: "photo-3-3",
        title: "Фото 3",
        src: "/images/gallery/horizontal-4.jpg",
        alt: "Фото 3 из альбома 3",
        width: 1920,
        height: 1080,
        category: "Архитектура"
      },
      {
        id: "photo-3-4",
        title: "Фото 4",
        src: "/images/gallery/horizontal-1.jpg",
        alt: "Фото 4 из альбома 3",
        width: 1920,
        height: 1080,
        category: "Архитектура"
      }
    ]
  },
  {
    id: "album-4",
    title: "Альбом 4",
    description: "Коллекция фотографий из четвертого альбома",
    coverImage: "/images/gallery/vertical-2.jpg",
    category: "События",
    createdAt: "2025-04-17",
    views: 178,
    isFavorite: true,
    photos: [
      {
        id: "photo-4-1",
        title: "Фото 1",
        src: "/images/gallery/vertical-2.jpg",
        alt: "Фото 1 из альбома 4",
        width: 1080,
        height: 1920,
        category: "События"
      },
      {
        id: "photo-4-2",
        title: "Фото 2",
        src: "/images/gallery/vertical-3.jpg",
        alt: "Фото 2 из альбома 4",
        width: 1080,
        height: 1920,
        category: "События"
      },
      {
        id: "photo-4-3",
        title: "Фото 3",
        src: "/images/gallery/vertical-4.jpg",
        alt: "Фото 3 из альбома 4",
        width: 1080,
        height: 1920,
        category: "События"
      },
      {
        id: "photo-4-4",
        title: "Фото 4",
        src: "/images/gallery/vertical-1.jpg",
        alt: "Фото 4 из альбома 4",
        width: 1080,
        height: 1920,
        category: "События"
      }
    ]
  }
];

// Демо видео для галереи
export const videos: Video[] = [
  {
    id: "video-1",
    title: "Горные пейзажи",
    src: "https://www.youtube.com/watch?v=1La4QzGeaaQ",
    thumbnail: "/images/gallery/horizontal-1.jpg",
    duration: "3:33",
    description: "Красивые виды горных вершин",
    category: "Природа",
    createdAt: "2025-04-20",
    views: 234,
    isFavorite: false
  },
  {
    id: "video-2",
    title: "Ледники и снега",
    src: "https://www.youtube.com/watch?v=2La4QzGeaaQ",
    thumbnail: "/images/gallery/horizontal-2.jpg",
    duration: "4:12",
    description: "Величественные ледники в горах",
    category: "Природа",
    createdAt: "2025-04-19",
    views: 189,
    isFavorite: true
  },
  {
    id: "video-3",
    title: "Горные тропы",
    src: "https://www.youtube.com/watch?v=3La4QzGeaaQ",
    thumbnail: "/images/gallery/horizontal-3.jpg",
    duration: "4:41",
    description: "Путешествие по горным тропам",
    category: "Природа",
    createdAt: "2025-04-18",
    views: 156,
    isFavorite: false
  },
  {
    id: "video-4",
    title: "Альпийские луга",
    src: "https://www.youtube.com/watch?v=4La4QzGeaaQ",
    thumbnail: "/images/gallery/horizontal-4.jpg",
    duration: "3:53",
    description: "Цветущие альпийские луга",
    category: "Природа",
    createdAt: "2025-04-17",
    views: 298,
    isFavorite: true
  }
];
