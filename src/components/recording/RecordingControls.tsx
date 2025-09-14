"use client";

import { useState, useRef, useEffect } from "react";
import { Column, Row, Text, Button, Icon, Badge } from "@once-ui-system/core";
import { captureModelScreenshot, captureScreenScreenshot, captureCameraScreenshot } from "@/utils/screenshot";
import { VideoRecorder, formatTime, getOptimalSettings } from "@/utils/videoRecording";

interface RecordingControlsProps {
  isFullscreen: boolean;
  isVRActive: boolean;
  isARActive: boolean;
  onScreenshot: () => void;
  onVideoRecord: (isRecording: boolean) => void;
}

interface RecordingState {
  isRecording: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  quality: '360p' | '480p' | '720p' | '1080p';
  recordingTime: number;
}

export function RecordingControls({ 
  isFullscreen, 
  isVRActive, 
  isARActive, 
  onScreenshot, 
  onVideoRecord 
}: RecordingControlsProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    quality: '720p',
    recordingTime: 0
  });
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false
  });
  const [showSettings, setShowSettings] = useState(false);

  const videoRecorderRef = useRef<VideoRecorder | null>(null);

  // Получение разрешений на камеру и микрофон
  const requestPermissions = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: getQualityDimensions(recordingState.quality).width },
          height: { ideal: getQualityDimensions(recordingState.quality).height },
          facingMode: 'user'
        },
        audio: recordingState.isAudioEnabled
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Разделяем потоки
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      setPermissions({ camera: videoTracks.length > 0, microphone: audioTracks.length > 0 });
      
      console.log('Разрешения получены:', { camera: videoTracks.length > 0, microphone: audioTracks.length > 0 });
      
      // НЕ останавливаем поток - оставляем для записи
      // stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Ошибка получения разрешений:', error);
      setPermissions({ camera: false, microphone: false });
    }
  };

  // Получение размеров для качества
  const getQualityDimensions = (quality: string) => {
    switch (quality) {
      case '360p': return { width: 640, height: 360 };
      case '480p': return { width: 854, height: 480 };
      case '720p': return { width: 1280, height: 720 };
      case '1080p': return { width: 1920, height: 1080 };
      default: return { width: 1280, height: 720 };
    }
  };

  // Запрос разрешений при монтировании
  useEffect(() => {
    console.log('RecordingControls mounted, requesting permissions...');
    requestPermissions();
  }, []);

  // Отладочная информация при монтировании
  useEffect(() => {
    console.log('RecordingControls component mounted');
    return () => {
      console.log('RecordingControls component unmounted');
    };
  }, []);

  // Очистка ресурсов при размонтировании
  useEffect(() => {
    return () => {
      if (videoRecorderRef.current) {
        videoRecorderRef.current.cleanup();
      }
    };
  }, []);

  // Обработка скриншота
  const handleScreenshot = async () => {
    onScreenshot();
    
    try {
      if (isARActive) {
        // В AR режиме - скриншот с камеры
        await captureCameraScreenshot({
          width: getQualityDimensions(recordingState.quality).width,
          height: getQualityDimensions(recordingState.quality).height,
          filename: `ar-screenshot-${Date.now()}`
        });
      } else if (isVRActive || isFullscreen) {
        // В VR или полноэкранном режиме - скриншот экрана
        await captureScreenScreenshot({
          filename: `vr-screenshot-${Date.now()}`
        });
      } else {
        // Обычный режим - скриншот 3D модели
        await captureModelScreenshot({
          width: getQualityDimensions(recordingState.quality).width,
          height: getQualityDimensions(recordingState.quality).height,
          filename: `3d-screenshot-${Date.now()}`
        });
      }
    } catch (error) {
      console.error('Ошибка создания скриншота:', error);
    }
  };

  // Обработка записи видео
  const handleVideoRecord = async () => {
    if (recordingState.isRecording) {
      // Останавливаем запись
      if (videoRecorderRef.current) {
        videoRecorderRef.current.stopRecording();
        videoRecorderRef.current.cleanup();
        videoRecorderRef.current = null;
      }
      setRecordingState(prev => ({ ...prev, isRecording: false, recordingTime: 0 }));
      onVideoRecord(false);
    } else {
      // Начинаем запись
      try {
        const optimalSettings = getOptimalSettings();
        const qualityDimensions = getQualityDimensions(recordingState.quality);
        
        const options = {
          width: qualityDimensions.width,
          height: qualityDimensions.height,
          frameRate: optimalSettings.frameRate,
          bitRate: optimalSettings.bitRate,
          filename: `3d-recording-${Date.now()}`
        };

        if (isARActive) {
          // В AR режиме - запись с камеры
          videoRecorderRef.current = new VideoRecorder(
            (state) => {
              setRecordingState(prev => ({ 
                ...prev, 
                isRecording: state.isRecording,
                recordingTime: Math.floor(state.duration / 1000)
              }));
            },
            (error) => {
              console.error('Ошибка записи:', error);
              setRecordingState(prev => ({ ...prev, isRecording: false }));
            }
          );
          await videoRecorderRef.current.initializeCamera(options);
        } else if (isVRActive || isFullscreen) {
          // В VR или полноэкранном режиме - запись экрана
          videoRecorderRef.current = new VideoRecorder(
            (state) => {
              setRecordingState(prev => ({ 
                ...prev, 
                isRecording: state.isRecording,
                recordingTime: Math.floor(state.duration / 1000)
              }));
            },
            (error) => {
              console.error('Ошибка записи:', error);
              setRecordingState(prev => ({ ...prev, isRecording: false }));
            }
          );
          await videoRecorderRef.current.initializeScreen(options);
        } else {
          // Обычный режим - запись с камеры
          videoRecorderRef.current = new VideoRecorder(
            (state) => {
              setRecordingState(prev => ({ 
                ...prev, 
                isRecording: state.isRecording,
                recordingTime: Math.floor(state.duration / 1000)
              }));
            },
            (error) => {
              console.error('Ошибка записи:', error);
              setRecordingState(prev => ({ ...prev, isRecording: false }));
            }
          );
          await videoRecorderRef.current.initializeCamera(options);
        }

        await videoRecorderRef.current.startRecording(options);
        setRecordingState(prev => ({ ...prev, isRecording: true }));
        onVideoRecord(true);

      } catch (error) {
        console.error('Ошибка записи видео:', error);
        setRecordingState(prev => ({ ...prev, isRecording: false }));
      }
    }
  };

  // Форматирование времени записи
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Переключение настроек
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Изменение качества
  const changeQuality = (quality: '360p' | '480p' | '720p' | '1080p') => {
    setRecordingState(prev => ({ ...prev, quality }));
    // Перезапрашиваем разрешения с новым качеством
    requestPermissions();
  };

  // Переключение аудио
  const toggleAudio = () => {
    setRecordingState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
  };

  // Переключение видео
  const toggleVideo = () => {
    setRecordingState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      {/* Основные кнопки записи */}
      <Row gap="m" align="center">
        {/* Кнопка фото */}
        <Button
          variant="secondary"
          size="l"
          onClick={handleScreenshot}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
          title="Сделать фото"
        >
          <Icon name="image" size="l" />
        </Button>

        {/* Кнопка записи видео */}
        <Button
          variant="secondary"
          size="xl"
          onClick={handleVideoRecord}
          style={{
            backgroundColor: recordingState.isRecording ? '#ff4444' : 'rgba(255, 255, 255, 0.9)',
            border: recordingState.isRecording ? '2px solid #ff4444' : '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            width: recordingState.isRecording ? '70px' : '80px',
            height: recordingState.isRecording ? '70px' : '80px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            animation: recordingState.isRecording ? 'pulse 1s infinite' : 'none'
          }}
          title={recordingState.isRecording ? "Остановить запись" : "Начать запись"}
        >
          {recordingState.isRecording ? (
            <div style={{ width: '20px', height: '20px', backgroundColor: '#ffffff', borderRadius: '4px' }} />
          ) : (
            <div style={{ width: '0', height: '0', borderLeft: '20px solid #ff4444', borderTop: '12px solid transparent', borderBottom: '12px solid transparent' }} />
          )}
        </Button>

        {/* Кнопка настроек */}
        <Button
          variant="secondary"
          size="l"
          onClick={toggleSettings}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
          title="Настройки"
        >
          <Icon name="gear" size="l" />
        </Button>
      </Row>

      {/* Индикатор записи */}
      {recordingState.isRecording && (
        <Row gap="s" align="center" style={{ backgroundColor: 'rgba(255, 68, 68, 0.9)', padding: '8px 16px', borderRadius: '20px', color: '#ffffff' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#ffffff', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
          <Text variant="body-default-s" style={{ color: '#ffffff', fontWeight: 'bold' }}>
            {formatRecordingTime(recordingState.recordingTime)}
          </Text>
        </Row>
      )}

      {/* Панель настроек */}
      {showSettings && (
        <Column 
          gap="m" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
            padding: '16px', 
            borderRadius: '12px', 
            backdropFilter: 'blur(8px)',
            minWidth: '200px'
          }}
        >
          <Text variant="body-default-s" style={{ color: '#ffffff', fontWeight: 'bold' }}>
            Настройки записи
          </Text>

          {/* Качество */}
          <Column gap="s">
            <Text variant="body-default-xs" style={{ color: '#ffffff' }}>
              Качество: {recordingState.quality}
            </Text>
            <Row gap="s" wrap>
              {(['360p', '480p', '720p', '1080p'] as const).map(quality => (
                <Button
                  key={quality}
                  variant={recordingState.quality === quality ? "primary" : "secondary"}
                  size="xs"
                  onClick={() => changeQuality(quality)}
                  style={{ fontSize: '10px', padding: '4px 8px' }}
                >
                  {quality}
                </Button>
              ))}
            </Row>
          </Column>

          {/* Переключатели */}
          <Row gap="m" align="center">
            <Button
              variant={recordingState.isVideoEnabled ? "primary" : "secondary"}
              size="xs"
              onClick={toggleVideo}
              prefixIcon="play"
              style={{ fontSize: '10px' }}
            >
              Видео
            </Button>
            <Button
              variant={recordingState.isAudioEnabled ? "primary" : "secondary"}
              size="xs"
              onClick={toggleAudio}
              prefixIcon="volume"
              style={{ fontSize: '10px' }}
            >
              Звук
            </Button>
          </Row>

          {/* Статус разрешений */}
          <Row gap="s" align="center">
            <Icon 
              name={permissions.camera ? "check" : "close"} 
              size="xs" 
              style={{ color: permissions.camera ? '#4ade80' : '#ef4444' }} 
            />
            <Text variant="body-default-xs" style={{ color: '#ffffff' }}>
              Камера
            </Text>
            <Icon 
              name={permissions.microphone ? "check" : "close"} 
              size="xs" 
              style={{ color: permissions.microphone ? '#4ade80' : '#ef4444' }} 
            />
            <Text variant="body-default-xs" style={{ color: '#ffffff' }}>
              Микрофон
            </Text>
          </Row>
        </Column>
      )}

      {/* CSS анимации */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
