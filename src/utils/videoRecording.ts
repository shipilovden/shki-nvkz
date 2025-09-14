/**
 * Утилиты для записи видео
 */

export interface VideoRecordingOptions {
  width?: number;
  height?: number;
  frameRate?: number;
  bitRate?: number;
  mimeType?: string;
  filename?: string;
}

export interface RecordingState {
  isRecording: boolean;
  startTime: number;
  duration: number;
  chunks: Blob[];
}

/**
 * Класс для записи видео
 */
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private state: RecordingState = {
    isRecording: false,
    startTime: 0,
    duration: 0,
    chunks: []
  };
  private onStateChange?: (state: RecordingState) => void;
  private onError?: (error: Error) => void;

  constructor(
    onStateChange?: (state: RecordingState) => void,
    onError?: (error: Error) => void
  ) {
    this.onStateChange = onStateChange;
    this.onError = onError;
  }

  /**
   * Инициализирует запись с камеры
   */
  async initializeCamera(options: VideoRecordingOptions = {}): Promise<void> {
    const {
      width = 1280,
      height = 720,
      frameRate = 30
    } = options;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('Камера инициализирована');
    } catch (error) {
      console.error('Ошибка инициализации камеры:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Инициализирует запись экрана
   */
  async initializeScreen(options: VideoRecordingOptions = {}): Promise<void> {
    const {
      width = 1920,
      height = 1080,
      frameRate = 30
    } = options;

    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate }
        },
        audio: true
      });

      console.log('Захват экрана инициализирован');
    } catch (error) {
      console.error('Ошибка инициализации захвата экрана:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Начинает запись
   */
  async startRecording(options: VideoRecordingOptions = {}): Promise<void> {
    if (!this.stream) {
      throw new Error('Поток не инициализирован');
    }

    const {
      mimeType = this.getSupportedMimeType(),
      filename = `recording-${Date.now()}`
    } = options;

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      this.chunks = [];
      this.state = {
        isRecording: true,
        startTime: Date.now(),
        duration: 0,
        chunks: []
      };

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.state.chunks = [...this.chunks];
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveRecording(filename);
        this.state.isRecording = false;
        this.onStateChange?.(this.state);
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('Ошибка записи:', event);
        this.onError?.(new Error('Ошибка записи видео'));
      };

      this.mediaRecorder.start(1000); // Записываем по 1 секунде
      this.onStateChange?.(this.state);

      // Обновляем длительность каждую секунду
      const timer = setInterval(() => {
        if (this.state.isRecording) {
          this.state.duration = Date.now() - this.state.startTime;
          this.onStateChange?.(this.state);
        } else {
          clearInterval(timer);
        }
      }, 1000);

      console.log('Запись начата');
    } catch (error) {
      console.error('Ошибка начала записи:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Останавливает запись
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.state.isRecording) {
      this.mediaRecorder.stop();
      console.log('Запись остановлена');
    }
  }

  /**
   * Паузирует запись
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.state.isRecording) {
      this.mediaRecorder.pause();
      console.log('Запись приостановлена');
    }
  }

  /**
   * Возобновляет запись
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.state.isRecording) {
      this.mediaRecorder.resume();
      console.log('Запись возобновлена');
    }
  }

  /**
   * Сохраняет запись
   */
  private saveRecording(filename: string): void {
    if (this.chunks.length === 0) {
      console.warn('Нет данных для сохранения');
      return;
    }

    const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.webm`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    console.log('Запись сохранена:', filename);
  }

  /**
   * Получает поддерживаемый MIME тип
   */
  private getSupportedMimeType(): string {
    const types = [
      'video/webm; codecs=vp9',
      'video/webm; codecs=vp8',
      'video/webm',
      'video/mp4; codecs=h264',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm';
  }

  /**
   * Очищает ресурсы
   */
  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.chunks = [];
    this.state = {
      isRecording: false,
      startTime: 0,
      duration: 0,
      chunks: []
    };
    
    console.log('Ресурсы очищены');
  }

  /**
   * Получает текущее состояние
   */
  getState(): RecordingState {
    return { ...this.state };
  }
}

/**
 * Создает запись с камеры
 */
export async function createCameraRecording(
  options: VideoRecordingOptions = {},
  onStateChange?: (state: RecordingState) => void,
  onError?: (error: Error) => void
): Promise<VideoRecorder> {
  const recorder = new VideoRecorder(onStateChange, onError);
  await recorder.initializeCamera(options);
  return recorder;
}

/**
 * Создает запись экрана
 */
export async function createScreenRecording(
  options: VideoRecordingOptions = {},
  onStateChange?: (state: RecordingState) => void,
  onError?: (error: Error) => void
): Promise<VideoRecorder> {
  const recorder = new VideoRecorder(onStateChange, onError);
  await recorder.initializeScreen(options);
  return recorder;
}

/**
 * Форматирует время в MM:SS
 */
export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Получает оптимальные настройки для устройства
 */
export function getOptimalSettings(): VideoRecordingOptions {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    return {
      width: 1280,
      height: 720,
      frameRate: 30,
      bitRate: 2000000
    };
  } else {
    return {
      width: 1920,
      height: 1080,
      frameRate: 60,
      bitRate: 5000000
    };
  }
}
