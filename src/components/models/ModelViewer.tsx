"use client";

import { useRef, useEffect, useState } from "react";
import { Column, Row, Text, Button, Icon, Badge } from "@once-ui-system/core";
import { RecordingControls } from "../recording/RecordingControls";
import type { Model3D } from "@/types/models.types";

interface ModelViewerProps {
  model: Model3D;
  onModelChange?: (model: Model3D) => void;
  onVREnter?: () => void;
  onAREnter?: () => void;
  onFullscreen?: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export function ModelViewer({ 
  model, 
  onVREnter, 
  onAREnter, 
  onFullscreen
}: ModelViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVRAvailable, setIsVRAvailable] = useState(false);
  const [isARAvailable, setIsARAvailable] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLightBackground, setIsLightBackground] = useState(true);
  const [isVRActive, setIsVRActive] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    console.log('ModelViewer mounted, model src:', model.src);
    
    // Сбрасываем состояние при смене модели
    setIsLoading(true);
    setHasError(false);
    
    // Проверяем, загружен ли model-viewer
    const checkModelViewer = () => {
      if (customElements.get('model-viewer')) {
        console.log('model-viewer is loaded');
        // Даем время на загрузку модели, затем показываем ошибку если не загрузилась
        setTimeout(() => {
          if (isLoading) {
            console.log('Model still loading after 10 seconds, checking...');
          }
        }, 10000);
      } else {
        console.log('model-viewer is not loaded yet, retrying...');
        setTimeout(checkModelViewer, 100);
      }
    };
    
    if (typeof window !== 'undefined') {
      checkModelViewer();
      
      // Проверяем поддержку VR/AR
      if ('xr' in navigator) {
        navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
          console.log('VR support:', supported);
          setIsVRAvailable(supported);
        });
        navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
          console.log('AR support:', supported);
          setIsARAvailable(supported);
        });
      } else {
        console.log('WebXR not supported in this browser');
      }

      // Обработчики полноэкранного режима
      const handleFullscreenChange = () => {
        const isFullscreenNow = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
        setIsFullscreen(isFullscreenNow);
        console.log('Fullscreen changed:', isFullscreenNow);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      };
    }
  }, [model.src, isLoading]);

  // Убираем таймаут - пусть модель загружается столько, сколько нужно

  const handleModelLoad = () => {
    console.log('Model loaded successfully:', model.title);
    setIsLoading(false);
    setHasError(false);
  };

  const handleModelError = (event: any) => {
    console.error('Model load error:', event.detail || 'Unknown error');
    console.error('Model src:', model.src);
    console.error('Full error event:', event);
    setIsLoading(false);
    setHasError(true);
  };

  const handleVREnter = () => {
    if (modelViewerRef.current && isVRAvailable) {
      modelViewerRef.current.enterVR();
      setIsVRActive(true);
      onVREnter?.();
    }
  };

  const handleAREnter = () => {
    if (modelViewerRef.current && isARAvailable) {
      modelViewerRef.current.enterAR();
      setIsARActive(true);
      onAREnter?.();
    }
  };

  const handleFullscreen = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.requestFullscreen();
      onFullscreen?.();
    }
  };

  const toggleBackground = () => {
    setIsLightBackground(!isLightBackground);
  };

  const handleScreenshot = () => {
    console.log('Скриншот сделан');
  };

  const handleVideoRecord = (recording: boolean) => {
    setIsRecording(recording);
    console.log('Запись видео:', recording ? 'начата' : 'остановлена');
  };

  return (
    <Column gap="l" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">

      {/* 3D Viewer */}
      <div 
        style={{ 
          width: '100%', 
          height: '500px', // Фиксированная высота для десктопа
          maxWidth: '800px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: isFullscreen ? 'none' : '2px solid var(--neutral-alpha-strong)',
          borderRadius: isFullscreen ? '0' : '8px',
          backgroundColor: isLightBackground ? '#ffffff' : '#000000',
          boxShadow: isFullscreen ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
        s={{
          height: '400px', // Меньшая высота для мобильных
          maxWidth: '100%' // Полная ширина на мобильных
        }}
      >
        {/* Убираем индикатор загрузки - model-viewer сам покажет загрузку */}

        {hasError && (
          <Column 
            align="center" 
            gap="m" 
            padding="xl"
            style={{ 
              width: '100%', 
              height: '400px',
              backgroundColor: 'var(--color-danger-alpha-weak)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon name="warning" size="l" onBackground="danger-medium" />
            <Text variant="body-default-m" onBackground="danger-medium">
              Ошибка загрузки модели
            </Text>
            <Text variant="body-default-s" onBackground="danger-weak" align="center">
              Проверьте ссылку на файл или попробуйте позже
            </Text>
            <Row gap="s" wrap>
              <Button
                variant="secondary"
                size="s"
                onClick={() => window.open(model.src, '_blank')}
                prefixIcon="openLink"
              >
                Проверить ссылку
              </Button>
              <Button
                variant="secondary"
                size="s"
                onClick={() => {
                  fetch(model.src, { method: 'HEAD' })
                    .then(response => {
                      console.log('File accessibility check:', {
                        url: model.src,
                        status: response.status,
                        headers: Object.fromEntries(response.headers.entries())
                      });
                      if (response.ok) {
                        alert('Файл доступен! Статус: ' + response.status);
                      } else {
                        alert('Файл недоступен! Статус: ' + response.status);
                      }
                    })
                    .catch(error => {
                      console.error('File accessibility error:', error);
                      alert('Ошибка проверки файла: ' + error.message);
                    });
                }}
                prefixIcon="globe"
              >
                Проверить доступность
              </Button>
            </Row>
          </Column>
        )}

        <model-viewer
          ref={modelViewerRef}
          src={model.src}
          alt={model.title}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: isLightBackground ? '#ffffff' : '#000000',
            borderRadius: '8px',
            display: 'block'
          }}
          camera-controls
          auto-rotate
          exposure="1.0"
          shadow-intensity="0.5"
          loading="eager"
          animation-name=""
          autoplay
          animation-crossfade-duration="300"
          onLoad={handleModelLoad}
          onError={handleModelError}
          onProgress={(event: any) => {
            console.log('Model loading progress:', event.detail);
          }}
          onModelVisibility={(event: any) => {
            console.log('Model visibility changed:', event.detail);
          }}
          // VR/AR настройки
          vr={isVRAvailable}
          ar={isARAvailable}
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          ar-placement="floor"
          // Дополнительные настройки для лучшего взаимодействия
          interaction-policy="allow-when-focused"
          touch-action="pan-y"
          min-camera-orbit="auto auto auto"
          max-camera-orbit="auto auto auto"
          min-field-of-view="10deg"
          max-field-of-view="45deg"
        >
          {/* Fallback для браузеров без поддержки model-viewer */}
          <div slot="poster" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-neutral-alpha-weak)',
            borderRadius: '12px'
          }}>
            <Column align="center" gap="m">
              <Icon name="3d" size="xl" onBackground="neutral-medium" />
              <Text variant="body-default-m" onBackground="neutral-medium">
                3D модель: {model.title}
              </Text>
            </Column>
          </div>
        </model-viewer>

        {/* Кнопка переключения фона - слева внизу */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            display: 'flex',
            gap: '8px',
            flexDirection: 'column',
            zIndex: 1000
          }}
        >
          <Button
            variant="secondary"
            size="xs"
            onClick={toggleBackground}
            prefixIcon={isLightBackground ? "darkMode" : "lightMode"}
            style={{
              backgroundColor: isLightBackground ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              border: isLightBackground ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(4px)',
              color: isLightBackground ? '#ffffff' : '#000000',
              minWidth: '32px',
              width: '32px',
              height: '32px',
              padding: '0',
              zIndex: 1000,
              boxShadow: isLightBackground ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
              fontSize: '12px'
            }}
            title={isLightBackground ? "Тёмный фон" : "Светлый фон"}
          />
        </div>

        {/* Система записи - по центру внизу, только в AR режиме */}
        {isARActive && (
          <RecordingControls
            isFullscreen={isFullscreen}
            isVRActive={isVRActive}
            isARActive={isARActive}
            onScreenshot={handleScreenshot}
            onVideoRecord={handleVideoRecord}
          />
        )}

        {/* Кнопки управления справа внизу как на Sketchfab */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            display: 'flex',
            gap: '8px',
            flexDirection: 'column'
          }}
        >
          {isVRAvailable && model.vrEnabled && (
            <Button
              variant="secondary"
              size="s"
              onClick={handleVREnter}
              prefixIcon="3d"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                color: 'var(--color-neutral-weak)'
              }}
            >
              VR
            </Button>
          )}
          
          {isARAvailable && model.arEnabled && (
            <Button
              variant="secondary"
              size="s"
              onClick={handleAREnter}
              prefixIcon="rocket"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                color: 'var(--color-neutral-weak)'
              }}
            >
              AR
            </Button>
          )}
          
          <Button
            variant="secondary"
            size="s"
            onClick={handleFullscreen}
            prefixIcon="expand"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              color: 'var(--color-neutral-weak)',
              minWidth: '40px',
              width: '40px',
              height: '40px',
              padding: '0'
            }}
          />
        </div>
      </div>

      {/* Информация о модели под вьювером как на Sketchfab */}
      <Column gap="m" align="start" style={{ width: '100%', maxWidth: '800px' }}>
        <Text variant="heading-strong-l" align="left">
          {model.title}
        </Text>
        <Text variant="body-default-m" onBackground="neutral-weak" align="left">
          {model.description}
        </Text>
        
        <Row gap="m" align="center" style={{ justifyContent: 'flex-start' }}>
          {model.author && (
            <Text variant="body-default-xs" onBackground="neutral-medium">
              Автор: {model.author}
            </Text>
          )}
          {model.year && (
            <Text variant="body-default-xs" onBackground="neutral-medium">
              {model.year}
            </Text>
          )}
          {model.size && (
            <Text variant="body-default-xs" onBackground="neutral-medium">
              {model.size}
            </Text>
          )}
        </Row>
        
        {/* Серая линия под информацией о модели */}
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: '#ddd',
            margin: '16px 0'
          }}
        />

      </Column>
    </Column>
  );
}
