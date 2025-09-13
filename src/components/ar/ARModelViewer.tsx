"use client";

import { useState, useEffect } from "react";
import { Column, Row, Text, Button, Icon } from "@once-ui-system/core";

interface ARModelViewerProps {
  modelId: string;
}

export function ARModelViewer({ modelId }: ARModelViewerProps) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [modelUrl, setModelUrl] = useState<string>("");

  useEffect(() => {
    // Проверяем поддержку WebXR
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
        setIsARSupported(supported);
      });
    }

    // Загружаем модель по ID из localStorage
    try {
      const storedModels = localStorage.getItem('arModels');
      if (storedModels) {
        const models = JSON.parse(storedModels);
        const model = models.find((m: any) => m.id === modelId);
        if (model && model.fileUrl) {
          setModelUrl(model.fileUrl);
        } else {
          // Если модель не найдена, используем тестовую модель
          setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
        }
      } else {
        // Если нет сохраненных моделей, используем тестовую модель
        setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
      }
    } catch (error) {
      console.error('Ошибка загрузки модели:', error);
      // В случае ошибки используем тестовую модель
      setModelUrl("https://modelviewer.dev/shared-assets/models/Astronaut.glb");
    }
  }, [modelId]);

  const startAR = async () => {
    if (!isARSupported) {
      alert('AR не поддерживается в вашем браузере');
      return;
    }

    try {
      // Здесь будет логика запуска AR сессии
      setIsARActive(true);
    } catch (error) {
      console.error('Ошибка запуска AR:', error);
      alert('Не удалось запустить AR');
    }
  };

  const exitAR = () => {
    setIsARActive(false);
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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <Column gap="l" align="center" style={{ textAlign: 'center' }}>
        <Icon name="rocket" size="l" onBackground="neutral-medium" style={{ fontSize: '64px' }} />
        
        <Text variant="heading-strong-l">
          AR Просмотр
        </Text>
        
        <Text variant="body-default-m" onBackground="neutral-weak">
          Модель ID: {modelId}
        </Text>

        {isARSupported ? (
          <Column gap="m" align="center">
            <Text variant="body-default-s" onBackground="neutral-medium">
              AR поддерживается в вашем браузере
            </Text>
            <Button
              variant="primary"
              size="l"
              onClick={startAR}
              prefixIcon="rocket"
            >
              Запустить AR
            </Button>
          </Column>
        ) : (
          <Column gap="m" align="center">
            <Text variant="body-default-s" onBackground="neutral-medium">
              AR не поддерживается в вашем браузере
            </Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              Используйте Chrome или Edge на мобильном устройстве
            </Text>
          </Column>
        )}

        {/* Предпросмотр модели */}
        {modelUrl && (
          <div
            style={{
              width: '300px',
              height: '300px',
              border: '1px solid var(--color-neutral-alpha-strong)',
              borderRadius: '8px',
              backgroundColor: 'white',
              marginTop: '20px'
            }}
          >
            <model-viewer
              src={modelUrl}
              alt="Model Preview"
              auto-rotate
              camera-controls
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent'
              }}
              camera-orbit="0deg 75deg 1.5m"
              field-of-view="30deg"
            />
          </div>
        )}
      </Column>
    </div>
  );
}
