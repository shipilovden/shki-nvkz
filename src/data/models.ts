import type { Model3D, ModelCategory } from "@/types/models.types";

// ========================================
// СИСТЕМА УПРАВЛЕНИЯ 3D МОДЕЛЯМИ
// ========================================

/**
 * Базовые настройки для всех моделей
 * Эти значения будут применены ко всем моделям автоматически
 */
const DEFAULT_MODEL_SETTINGS = {
  format: "glb" as const,
  author: "shki-nvkz",
  year: 2024,
  license: "Creative Commons",
  vrEnabled: true,
  arEnabled: true,
  autoRotate: true,
  cameraControls: true,
  exposure: 1.0,
  shadowIntensity: 0.5
};

/**
 * Доступные модели - используем только проверенные рабочие модели
 * Добавляйте новые модели в этот массив
 */
const AVAILABLE_MODELS = [
  {
    id: "3",
    title: "Робот",
    description: "3D модель робота-андроида",
    src: "https://modelviewer.dev/shared-assets/models/RobotExpressive.glb",
    thumbnail: "/images/models/robot-thumb.svg",
    category: "technical",
    tags: ["робот", "техника", "андроид"],
    size: "3.5 MB"
  },
  {
    id: "1",
    title: "Астронавт",
    description: "3D модель астронавта в скафандре",
    src: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    thumbnail: "/images/models/astronaut-thumb.svg",
    category: "characters",
    tags: ["космос", "астронавт", "скафандр"],
    size: "1.2 MB"
  },
  {
    id: "2", 
    title: "Лошадь",
    description: "3D модель лошади",
    src: "https://modelviewer.dev/shared-assets/models/Horse.glb",
    thumbnail: "/images/models/horse-thumb.svg",
    category: "animals",
    tags: ["животные", "лошадь", "природа"],
    size: "2.1 MB"
  },
  {
    id: "4",
    title: "Астронавт 2",
    description: "Вторая модель астронавта",
    src: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb",
    thumbnail: "/images/models/astronaut2-thumb.svg",
    category: "characters",
    tags: ["космос", "астронавт", "скафандр"],
    size: "1.0 MB"
  },
  {
    id: "5",
    title: "Анимированный кот",
    description: "3D модель анимированного кота",
    src: "/models/animated_cat.glb",
    thumbnail: "/images/models/cat-thumb.svg",
    category: "animals",
    tags: ["животные", "кот", "анимация"],
    size: "2.5 MB"
  },
  {
    id: "6",
    title: "Денис",
    description: "3D модель персонажа Денис",
    src: "/models/Denis.glb",
    thumbnail: "/images/models/astronaut-thumb.svg",
    category: "characters",
    tags: ["персонаж", "человек", "Денис"],
    size: "3.0 MB"
  },
  {
    id: "7",
    title: "Натараджа Шива",
    description: "3D модель индуистского божества",
    src: "/models/nataraja_shiva.glb",
    thumbnail: "/images/models/astronaut2-thumb.svg",
    category: "characters",
    tags: ["религия", "индуизм", "божество"],
    size: "4.2 MB"
  },
  {
    id: "8",
    title: "Цифра 2",
    description: "3D модель цифры 2",
    src: "/models/number_2.glb",
    thumbnail: "/images/models/table-thumb.svg",
    category: "technical",
    tags: ["цифры", "математика", "образование"],
    size: "0.8 MB"
  },
  {
    id: "9",
    title: "Пицца",
    description: "3D модель пиццы",
    src: "/models/pizza.glb",
    thumbnail: "/images/models/table-thumb.svg",
    category: "objects",
    tags: ["еда", "пицца", "кулинария"],
    size: "1.5 MB"
  },
  {
    id: "10",
    title: "Портал",
    description: "3D модель портала",
    src: "/models/portal.glb",
    thumbnail: "/images/models/blue-house-pool-thumb.svg",
    category: "technical",
    tags: ["портал", "фантастика", "технологии"],
    size: "2.8 MB"
  },
  {
    id: "11",
    title: "Девушка в купальнике",
    description: "3D модель девушки в купальнике",
    src: "/models/swimsuit_girl.glb",
    thumbnail: "/images/models/astronaut-thumb.svg",
    category: "characters",
    tags: ["персонаж", "девушка", "пляж"],
    size: "3.5 MB"
  },
  {
    id: "12",
    title: "Южный белый носорог",
    description: "3D модель южного белого носорога",
    src: "/models/southern_white_rhino.glb",
    thumbnail: "/images/models/horse-thumb.svg",
    category: "animals",
    tags: ["животные", "носорог", "природа", "африка"],
    size: "4.8 MB"
  },
  {
    id: "13",
    title: "Торт Maison Alyzee",
    description: "3D модель торта Maison Alyzee",
    src: "/models/cake_maison_alyzee.glb",
    thumbnail: "/images/models/table-thumb.svg",
    category: "objects",
    tags: ["еда", "торт", "десерт", "кулинария"],
    size: "2.1 MB"
  },
  {
    id: "14",
    title: "Кусок торта",
    description: "3D модель куска торта",
    src: "/models/piece_of_cake.glb",
    thumbnail: "/images/models/table-thumb.svg",
    category: "objects",
    tags: ["еда", "торт", "десерт", "кулинария"],
    size: "1.8 MB"
  },
  {
    id: "15",
    title: "Кусок фруктового торта",
    description: "3D модель куска фруктового торта",
    src: "/models/fruit_cake_slice.glb",
    thumbnail: "/images/models/table-thumb.svg",
    category: "objects",
    tags: ["еда", "торт", "фрукты", "десерт"],
    size: "2.3 MB"
  }
];

/**
 * Функция для создания полной модели с настройками по умолчанию
 */
function createModel(modelData: typeof AVAILABLE_MODELS[0]): Model3D {
  return {
    ...modelData,
    ...DEFAULT_MODEL_SETTINGS
  };
}

/**
 * Экспортируемый массив моделей
 * Автоматически применяет настройки по умолчанию ко всем моделям
 */
export const models3D: Model3D[] = AVAILABLE_MODELS.map(createModel);

export const modelCategories: ModelCategory[] = [
  { id: "all", name: "Все модели", icon: "package" },
  { id: "architecture", name: "Архитектура", icon: "building" },
  { id: "characters", name: "Персонажи", icon: "person" },
  { id: "products", name: "Продукты", icon: "cube" },
  { id: "furniture", name: "Мебель", icon: "chair" },
  { id: "sculptures", name: "Скульптуры", icon: "palette" },
  { id: "technical", name: "Техника", icon: "gear" },
  { id: "games", name: "Игры", icon: "gamepad" },
];