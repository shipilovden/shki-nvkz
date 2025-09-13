import type { Track, Playlist } from "@/types/music.types";

// Демо треки для музыкальной школы
export const tracks: Track[] = [
  // Локальные треки (будут в папке public/music/)
  {
    id: "1",
    title: "El Gigante De Hierro",
    artist: "El Gigante",
    duration: "3:45",
    source: "local",
    url: "/music/El Gigante De Hierro.mp3",
    genre: "Инструментальная",
    year: 2024,
    album: "El Gigante De Hierro"
  },
  {
    id: "2", 
    title: "Лунная соната",
    artist: "Л.В. Бетховен",
    duration: "15:00",
    source: "cloud",
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    genre: "Классика",
    year: 1801,
    album: "Соната №14"
  },
  {
    id: "3",
    title: "Времена года - Весна",
    artist: "А. Вивальди",
    duration: "10:00",
    source: "cloud", 
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    genre: "Классика",
    year: 1725,
    album: "Времена года"
  },
  
  // Облачные треки (примеры ссылок)
  {
    id: "4",
    title: "Джазовая импровизация",
    artist: "Студенты НВКЗ",
    duration: "4:30",
    source: "cloud",
    url: "https://drive.google.com/uc?export=download&id=example1",
    genre: "Джаз",
    year: 2024,
    album: "Студенческие работы"
  },
  {
    id: "5",
    title: "Рок-композиция",
    artist: "Группа 'Креатив'",
    duration: "3:45",
    source: "cloud",
    url: "https://yadi.sk/d/example2",
    genre: "Рок",
    year: 2024,
    album: "Школьные проекты"
  },
  {
    id: "6",
    title: "Электронная музыка",
    artist: "DJ НВКЗ",
    duration: "5:20",
    source: "cloud",
    url: "https://dropbox.com/s/example3",
    genre: "Электроника",
    year: 2024,
    album: "Цифровое творчество"
  },
  {
    id: "7",
    title: "Народная песня",
    artist: "Фольклорный ансамбль",
    duration: "2:55",
    source: "local",
    url: "/music/folk-song.mp3",
    genre: "Фольклор",
    year: 2023,
    album: "Русские традиции"
  },
  {
    id: "8",
    title: "Блюз",
    artist: "Гитарист НВКЗ",
    duration: "4:15",
    source: "cloud",
    url: "https://soundcloud.com/example4",
    genre: "Блюз",
    year: 2024,
    album: "Сольные выступления"
  }
];

export const playlists: Playlist[] = [
  {
    id: "classical",
    name: "Классическая музыка",
    description: "Произведения великих композиторов",
    tracks: tracks.filter(track => track.genre === "Классика")
  },
  {
    id: "student-works",
    name: "Студенческие работы",
    description: "Творчество учащихся школы",
    tracks: tracks.filter(track => track.album?.includes("Студенческие") || track.album?.includes("Школьные"))
  },
  {
    id: "modern",
    name: "Современная музыка",
    description: "Современные жанры и стили",
    tracks: tracks.filter(track => ["Рок", "Электроника", "Блюз"].includes(track.genre || ""))
  }
];

// Функция для получения треков по жанру
export const getTracksByGenre = (genre: string): Track[] => {
  return tracks.filter(track => track.genre === genre);
};

// Функция для получения треков по источнику
export const getTracksBySource = (source: 'local' | 'cloud'): Track[] => {
  return tracks.filter(track => track.source === source);
};

// Функция для поиска треков
export const searchTracks = (query: string): Track[] => {
  const lowercaseQuery = query.toLowerCase();
  return tracks.filter(track => 
    track.title.toLowerCase().includes(lowercaseQuery) ||
    track.artist.toLowerCase().includes(lowercaseQuery) ||
    track.album?.toLowerCase().includes(lowercaseQuery) ||
    track.genre?.toLowerCase().includes(lowercaseQuery)
  );
};
