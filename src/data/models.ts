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
    id: "4",
    title: "Астронавт 2",
    description: "Вторая модель астронавта",
    src: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb",
    thumbnail: "/images/models/astronaut2-thumb.svg",
    category: "characters",
    tags: ["космос", "астронавт", "скафандр"],
    size: "1.0 MB"
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