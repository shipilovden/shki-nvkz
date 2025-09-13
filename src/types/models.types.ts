export interface Model3D {
  id: string;
  title: string;
  description: string;
  src: string; // Google Drive ссылка на GLB файл
  thumbnail?: string; // Превью изображение
  category: string;
  tags: string[];
  size?: string; // Размер файла
  format: 'glb' | 'gltf';
  author?: string;
  year?: number;
  license?: string;
  // VR/AR настройки
  vrEnabled?: boolean;
  arEnabled?: boolean;
  // Настройки отображения
  autoRotate?: boolean;
  cameraControls?: boolean;
  environmentImage?: string; // HDR окружение
  exposure?: number;
  shadowIntensity?: number;
}

export interface ModelCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  models: Model3D[];
}

export interface ModelViewerProps {
  model: Model3D;
  onModelChange?: (model: Model3D) => void;
  onVREnter?: () => void;
  onAREnter?: () => void;
  onFullscreen?: () => void;
}

export interface ModelGalleryProps {
  models: Model3D[];
  selectedModel?: Model3D;
  onModelSelect: (model: Model3D) => void;
  onVREnter?: () => void;
  onAREnter?: () => void;
}
