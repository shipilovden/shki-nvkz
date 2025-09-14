"use client";

import { useState, useEffect, useRef } from "react";
import { Column, Row, Text, Button, Icon, Badge } from "@once-ui-system/core";
import { arStorage } from "@/utils/arStorage";

interface ARModelViewerProps {
  modelId: string;
}

export function ARModelViewer({ modelId }: ARModelViewerProps) {
  const modelViewerRef = useRef<any>(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [isVRAvailable, setIsVRAvailable] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [isVRActive, setIsVRActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelUrl, setModelUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [modelInfo, setModelInfo] = useState<any>(null);

  useEffect(() => {
    // Проверяем поддержку AR/VR через model-viewer
    const checkSupport = () => {
      // Проверяем поддержку AR
      if ('xr' in navigator) {
        navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
          setIsARSupported(supported);
        }).catch(() => {
          // Fallback: проверяем через user agent
          const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          setIsARSupported(isMobile);
        });
        
        navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
          setIsVRAvailable(supported);
        }).catch(() => {
          setIsVRAvailable(false);
        });
      } else {
        // Fallback для браузеров без WebXR
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsARSupported(isMobile);
        setIsVRAvailable(false);
      }
    };

    checkSupport();

    // Загружаем модель по ID с сервера
    const loadModel = async () => {
      try {
        // Сначала пробуем загрузить с сервера (для QR кодов)
        try {
          console.log('Пытаемся загрузить модель с сервера:', modelId);
          const response = await fetch(`/api/ar/models/${modelId}`);
          console.log('Ответ сервера:', response.status, response.statusText);
          
          if (response.ok) {
            const model = await response.json();
            console.log('Модель загружена с сервера:', model);
            if (model && model.fileUrl) {
              setModelUrl(model.fileUrl);
              setModelInfo(model);
              setIsLoading(false);
              return;
            }
          } else {
            console.warn('Сервер вернул ошибку:', response.status, response.statusText);
          }
        } catch (serverError) {
          console.warn('Не удалось загрузить модель с сервера:', serverError);
        }

        // Fallback к IndexedDB для локального использования
        console.log('Пробуем загрузить из IndexedDB...');
        if (arStorage.isSupported()) {
          const model = await arStorage.getModel(modelId);
          console.log('Модель из IndexedDB:', model);
          if (model && model.fileUrl) {
            setModelUrl(model.fileUrl);
            setModelInfo(model);
            setIsLoading(false);
            return;
          }
        } else {
          // Fallback к localStorage для старых браузеров
          console.log('Пробуем загрузить из localStorage...');
          const storedModels = localStorage.getItem('arModels');
          if (storedModels) {
            const models = JSON.parse(storedModels);
            const model = models.find((m: any) => m.id === modelId);
            console.log('Модель из localStorage:', model);
            if (model && model.fileUrl) {
              setModelUrl(model.fileUrl);
              setModelInfo(model);
              setIsLoading(false);
              return;
            }
          }
        }

        // Если модель не найдена нигде, используем тестовую модель
        setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
      } catch (error) {
        console.error('Ошибка загрузки модели:', error);
        setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
      }
    };

    loadModel();
  }, [modelId]);

  const startAR = () => {
    if (modelViewerRef.current && isARSupported) {
      modelViewerRef.current.enterAR();
      setIsARActive(true);
    }
  };

  const startVR = () => {
    if (modelViewerRef.current && isVRAvailable) {
      modelViewerRef.current.enterVR();
      setIsVRActive(true);
    }
  };

  const toggleFullscreen = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const exitAR = () => {
    setIsARActive(false);
  };

  const exitVR = () => {
    setIsVRActive(false);
  };

  if (isARActive) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {/* AR Viewport */}
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {/* Камера и AR контент */}
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
          >
            {/* Здесь будет AR камера и 3D модель */}
            <model-viewer
              src={modelUrl}
              alt="AR Model"
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          {/* Кнопка выхода из AR */}
          <Button
            variant="secondary"
            size="s"
            onClick={exitAR}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white'
            }}
            prefixIcon="close"
          >
            Выйти из AR
          </Button>

          {/* Инструкции */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}
          >
            <Text variant="body-default-s" style={{ color: 'white' }}>
              Наведите камеру на QR код для отображения модели
            </Text>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Icon name="package" size="l" onBackground="neutral-medium" style={{ fontSize: '48px' }} />
        <Text variant="body-default-m" onBackground="neutral-medium">
          Загрузка модели...
        </Text>
      </div>
    );
  }

  if (hasError) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <Icon name="warning" size="l" onBackground="danger-medium" style={{ fontSize: '48px' }} />
        <Text variant="body-default-m" onBackground="danger-medium">
          Ошибка загрузки модели
        </Text>
        <Text variant="body-default-s" onBackground="neutral-medium">
          Модель ID: {modelId}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Информация о модели в верхнем левом углу */}
      {modelInfo && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          maxWidth: '300px'
        }}>
          <Text variant="heading-strong-s">{modelInfo.name}</Text>
          <Text variant="body-default-xs" onBackground="neutral-weak" style={{ marginTop: '4px' }}>
            {modelInfo.description}
          </Text>
          <Row gap="s" align="center" style={{ marginTop: '8px' }}>
            <Badge variant="neutral" size="s">
              {(modelInfo.fileSize / 1024 / 1024).toFixed(1)} МБ
            </Badge>
            <Badge variant="neutral" size="s">
              {new Date(modelInfo.createdAt).toLocaleDateString('ru-RU')}
            </Badge>
          </Row>
        </div>
      )}

      {/* 3D Viewer на весь экран */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {modelUrl ? (
          <model-viewer
            ref={modelViewerRef}
            src={modelUrl}
            alt={modelInfo?.name || "AR Model"}
            auto-rotate
            camera-controls
            ar
            ar-modes="webxr scene-viewer quick-look"
            vr
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              display: 'block'
            }}
            camera-orbit="0deg 75deg 1.5m"
            field-of-view="30deg"
            exposure="1.0"
            shadow-intensity="0.5"
            loading="eager"
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
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
              backgroundColor: 'var(--color-neutral-alpha-weak)'
            }}>
              <Column align="center" gap="m">
                <Icon name="package" size="xl" onBackground="neutral-medium" />
                <Text variant="body-default-m" onBackground="neutral-medium">
                  3D модель: {modelInfo?.name || "Загрузка..."}
                </Text>
              </Column>
            </div>
          </model-viewer>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: 'var(--color-neutral-alpha-weak)'
          }}>
            <Icon name="package" size="xl" onBackground="neutral-medium" />
            <Text variant="body-default-m" onBackground="neutral-medium">
              Модель не найдена
            </Text>
            <Text variant="body-default-s" onBackground="neutral-weak">
              ID: {modelId}
            </Text>
          </div>
        )}
      </div>

      {/* Кнопки управления в правом нижнем углу как на Sketchfab */}
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
        {isVRAvailable && (
          <Button
            variant="secondary"
            size="s"
            onClick={startVR}
            prefixIcon="3d"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4px)'
            }}
          >
            VR
          </Button>
        )}
        
        {isARSupported && (
          <Button
            variant="secondary"
            size="s"
            onClick={startAR}
            prefixIcon="rocket"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4px)'
            }}
          >
            AR
          </Button>
        )}
        
        <Button
          variant="secondary"
          size="s"
          onClick={toggleFullscreen}
          prefixIcon="expand"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4px)',
            minWidth: '40px',
            width: '40px',
            height: '40px',
            padding: '0'
          }}
        />
      </div>

      {/* Индикатор поддержки в левом нижнем углу */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          display: 'flex',
          gap: '12px',
          zIndex: 10
        }}
      >
        <Row gap="s" align="center" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '6px 12px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <Icon 
            name={isARSupported ? "check" : "close"} 
            size="s" 
            onBackground={isARSupported ? "success-medium" : "danger-medium"} 
          />
          <Text variant="body-default-xs" onBackground="neutral-medium">
            AR
          </Text>
        </Row>
        
        <Row gap="s" align="center" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '6px 12px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <Icon 
            name={isVRAvailable ? "check" : "close"} 
            size="s" 
            onBackground={isVRAvailable ? "success-medium" : "danger-medium"} 
          />
          <Text variant="body-default-xs" onBackground="neutral-medium">
            VR
          </Text>
        </Row>
      </div>
    </div>
  );
}
