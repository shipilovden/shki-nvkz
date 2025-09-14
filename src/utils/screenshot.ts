/**
 * Утилиты для создания скриншотов 3D сцены
 */

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  filename?: string;
}

/**
 * Создает скриншот 3D модели из model-viewer
 */
export async function captureModelScreenshot(options: ScreenshotOptions = {}): Promise<void> {
  const {
    width = 1920,
    height = 1080,
    format = 'png',
    quality = 0.9,
    filename = `3d-screenshot-${Date.now()}`
  } = options;

  const modelViewer = document.querySelector('model-viewer') as any;
  
  if (!modelViewer) {
    console.error('model-viewer не найден');
    return;
  }

  try {
    // Получаем canvas из model-viewer
    const canvas = await modelViewer.toDataURL({
      width,
      height,
      format
    });

    // Создаем blob из data URL
    const response = await fetch(canvas);
    const blob = await response.blob();

    // Скачиваем файл
    downloadBlob(blob, `${filename}.${format}`);
    
    console.log('Скриншот сохранен:', filename);
  } catch (error) {
    console.error('Ошибка создания скриншота:', error);
    
    // Fallback - создаем простой скриншот
    createFallbackScreenshot(filename);
  }
}

/**
 * Создает скриншот экрана (включая 3D модель)
 */
export async function captureScreenScreenshot(options: ScreenshotOptions = {}): Promise<void> {
  const {
    format = 'png',
    quality = 0.9,
    filename = `screen-screenshot-${Date.now()}`
  } = options;

  try {
    // Запрашиваем разрешение на захват экрана
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'screen',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    // Создаем video элемент для захвата
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // Ждем загрузки видео
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // Создаем canvas для захвата
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Не удалось получить контекст canvas');
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Рисуем кадр на canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Останавливаем поток
    stream.getTracks().forEach(track => track.stop());

    // Создаем blob и скачиваем
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${filename}.${format}`);
        console.log('Скриншот экрана сохранен:', filename);
      }
    }, `image/${format}`, quality);

  } catch (error) {
    console.error('Ошибка захвата экрана:', error);
    
    // Fallback - создаем простой скриншот
    createFallbackScreenshot(filename);
  }
}

/**
 * Создает скриншот с камеры (для AR режима)
 */
export async function captureCameraScreenshot(options: ScreenshotOptions = {}): Promise<void> {
  const {
    width = 1920,
    height = 1080,
    format = 'png',
    quality = 0.9,
    filename = `camera-screenshot-${Date.now()}`
  } = options;

  try {
    // Запрашиваем доступ к камере
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: width },
        height: { ideal: height },
        facingMode: 'user'
      }
    });

    // Создаем video элемент
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // Ждем загрузки
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // Создаем canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Не удалось получить контекст canvas');
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Рисуем кадр
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Останавливаем поток
    stream.getTracks().forEach(track => track.stop());

    // Создаем blob и скачиваем
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${filename}.${format}`);
        console.log('Скриншот с камеры сохранен:', filename);
      }
    }, `image/${format}`, quality);

  } catch (error) {
    console.error('Ошибка захвата с камеры:', error);
    
    // Fallback - создаем простой скриншот
    createFallbackScreenshot(filename);
  }
}

/**
 * Создает простой скриншот как fallback
 */
function createFallbackScreenshot(filename: string): void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;

  canvas.width = 800;
  canvas.height = 600;
  
  // Рисуем простой фон
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Рисуем текст
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('3D Model Screenshot', canvas.width / 2, canvas.height / 2 - 20);
  
  ctx.font = '16px Arial';
  ctx.fillText('Скриншот создан', canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText(new Date().toLocaleString('ru-RU'), canvas.width / 2, canvas.height / 2 + 50);
  
  // Скачиваем
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, `${filename}.png`);
    }
  }, 'image/png');
}

/**
 * Скачивает blob как файл
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Получает размеры экрана для оптимального качества
 */
export function getOptimalDimensions(): { width: number; height: number } {
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  // Ограничиваем максимальный размер
  const maxWidth = 1920;
  const maxHeight = 1080;
  
  let width = Math.min(screenWidth, maxWidth);
  let height = Math.min(screenHeight, maxHeight);
  
  // Сохраняем пропорции
  if (screenWidth > screenHeight) {
    height = (width * screenHeight) / screenWidth;
  } else {
    width = (height * screenWidth) / screenHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}
