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
    // Проверяем поддержку WebXR для AR и VR
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
        setIsARSupported(supported);
      });
      navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
        setIsVRAvailable(supported);
      });
    }

    // Загружаем модель по ID с сервера
    const loadModel = async () => {
      try {
        // Сначала пробуем загрузить с сервера (для QR кодов)
        try {
          const response = await fetch(`/api/ar/models/${modelId}`);
          if (response.ok) {
            const model = await response.json();
            if (model && model.fileUrl) {
              setModelUrl(model.fileUrl);
              setModelInfo(model);
              setIsLoading(false);
              return;
            }
          }
        } catch (serverError) {
          console.warn('Не удалось загрузить модель с сервера:', serverError);
        }

        // Fallback к IndexedDB для локального использования
        if (arStorage.isSupported()) {
          const model = await arStorage.getModel(modelId);
          if (model && model.fileUrl) {
            setModelUrl(model.fileUrl);
            return;
          }
        } else {
          // Fallback к localStorage для старых браузеров
          const storedModels = localStorage.getItem('arModels');
          if (storedModels) {
            const models = JSON.parse(storedModels);
            const model = models.find((m: any) => m.id === modelId);
            if (model && model.fileUrl) {
              setModelUrl(model.fileUrl);
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

  const startAR = async () => {
    if (!isARSupported) {
      alert('AR не поддерживается в вашем браузере');
      return;
    }

    try {
      if (modelViewerRef.current) {
        await modelViewerRef.current.activateAR();
        setIsARActive(true);
      }
    } catch (error) {
      console.error('Ошибка запуска AR:', error);
      alert('Не удалось запустить AR');
    }
  };

  const startVR = async () => {
    if (!isVRAvailable) {
      alert('VR не поддерживается в вашем браузере');
      return;
    }

    try {
      if (modelViewerRef.current) {
        await modelViewerRef.current.activateVR();
        setIsVRActive(true);
      }
    } catch (error) {
      console.error('Ошибка запуска VR:', error);
      alert('Не удалось запустить VR');
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Ошибка переключения полноэкранного режима:', error);
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
    <Column gap="l" style={{ width: '100%' }}>
      {/* Информация о модели */}
      {modelInfo && (
        <Row gap="m" align="center" style={{ 
          padding: '16px', 
          backgroundColor: 'var(--color-neutral-alpha-weak)', 
          borderRadius: '8px' 
        }}>
          <Column flex={1}>
            <Text variant="heading-strong-s">{modelInfo.name}</Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
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
          </Column>
        </Row>
      )}

      {/* 3D Viewer */}
      <div
        style={{
          width: '100%',
          height: '500px',
          border: '1px solid var(--color-neutral-alpha-strong)',
          borderRadius: '12px',
          backgroundColor: 'var(--color-neutral-alpha-weak)',
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
              backgroundColor: 'transparent'
            }}
            camera-orbit="0deg 75deg 1.5m"
            field-of-view="30deg"
            onLoad={() => setIsLoading(false)}
            onError={() => setHasError(true)}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <Icon name="package" size="l" onBackground="neutral-medium" style={{ fontSize: '48px' }} />
            <Text variant="body-default-m" onBackground="neutral-medium">
              Модель не найдена
            </Text>
          </div>
        )}
      </div>

      {/* Панель управления */}
      <Row gap="m" align="center" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        {isARSupported && (
          <Button
            variant="primary"
            size="m"
            onClick={startAR}
            prefixIcon="rocket"
          >
            Запустить AR
          </Button>
        )}
        
        {isVRAvailable && (
          <Button
            variant="secondary"
            size="m"
            onClick={startVR}
            prefixIcon="3d"
          >
            Запустить VR
          </Button>
        )}
        
        <Button
          variant="tertiary"
          size="m"
          onClick={toggleFullscreen}
          prefixIcon={isFullscreen ? "close" : "expand"}
        >
          {isFullscreen ? "Выйти из полноэкранного" : "Полноэкранный"}
        </Button>
      </Row>

      {/* Информация о поддержке */}
      <Row gap="l" align="center" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <Row gap="s" align="center">
          <Icon 
            name={isARSupported ? "check" : "close"} 
            size="s" 
            onBackground={isARSupported ? "success-medium" : "danger-medium"} 
          />
          <Text variant="body-default-xs" onBackground="neutral-medium">
            AR: {isARSupported ? "Поддерживается" : "Не поддерживается"}
          </Text>
        </Row>
        
        <Row gap="s" align="center">
          <Icon 
            name={isVRAvailable ? "check" : "close"} 
            size="s" 
            onBackground={isVRAvailable ? "success-medium" : "danger-medium"} 
          />
          <Text variant="body-default-xs" onBackground="neutral-medium">
            VR: {isVRAvailable ? "Поддерживается" : "Не поддерживается"}
          </Text>
        </Row>
      </Row>
    </Column>
  );
}
