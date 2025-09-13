"use client";

import { useState, useRef } from "react";
import { Column, Row, Text, Button, Icon, useToast } from "@once-ui-system/core";
import type { ARViewerProps } from "@/types/ar.types";

export function ARViewer({ model }: ARViewerProps) {
  const { addToast } = useToast();
  const [isARMode, setIsARMode] = useState(false);
  const modelViewerRef = useRef<any>(null);

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = model.qrCodeUrl;
    link.download = `${model.name}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast({
      variant: "success",
      message: "QR код скачан",
    });
  };

  const copyARLink = async () => {
    try {
      await navigator.clipboard.writeText(model.arUrl);
      addToast({
        variant: "success",
        message: "Ссылка скопирована в буфер обмена",
      });
    } catch (error) {
      addToast({
        variant: "danger",
        message: "Не удалось скопировать ссылку",
      });
    }
  };

  const startAR = () => {
    setIsARMode(true);
    // Здесь будет логика запуска AR режима
    addToast({
      variant: "info",
      message: "AR режим активирован. Наведите камеру на QR код",
    });
  };

  return (
    <Column 
      gap="l" 
      padding="l"
      style={{
        width: '100%',
        border: '1px solid var(--color-neutral-alpha-strong)',
        borderRadius: '12px',
        backgroundColor: 'var(--color-neutral-alpha-weak)'
      }}
      align="center"
    >
      {/* Заголовок модели */}
      <Column gap="s" align="center">
        <Text variant="heading-strong-m" align="center">
          {model.name}
        </Text>
        <Text variant="body-default-s" onBackground="neutral-weak" align="center">
          {model.description}
        </Text>
      </Column>

      {/* 3D Viewer */}
      <div
        style={{
          width: '100%',
          height: '400px',
          border: '1px solid var(--color-neutral-alpha-strong)',
          borderRadius: '8px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {model.fileUrl ? (
          <model-viewer
            ref={modelViewerRef}
            src={model.fileUrl}
            alt={model.name}
            auto-rotate
            camera-controls
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent'
            }}
            camera-orbit="0deg 75deg 1.5m"
            field-of-view="30deg"
            min-camera-orbit="auto auto 0.5m"
            max-camera-orbit="auto auto 10m"
          />
        ) : (
          <Column gap="m" align="center">
            <Icon name="package" size="l" onBackground="neutral-medium" />
            <Text variant="body-default-s" onBackground="neutral-medium">
              Модель не загружена
            </Text>
          </Column>
        )}
      </div>

      {/* QR код */}
      <Column gap="m" align="center">
        <Text variant="body-strong-s" align="center">
          QR код для AR
        </Text>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid var(--color-neutral-alpha-strong)'
          }}
        >
          <img
            src={model.qrCodeUrl}
            alt="QR код для AR"
            style={{
              width: '200px',
              height: '200px',
              display: 'block'
            }}
          />
        </div>
        <Text variant="body-default-xs" onBackground="neutral-weak" align="center">
          Распечатайте QR код и наведите на него камеру
        </Text>
      </Column>

      {/* Кнопки управления */}
      <Row gap="m" align="center" wrap>
        <Button
          variant="primary"
          onClick={startAR}
          prefixIcon="rocket"
        >
          Запустить AR
        </Button>
        <Button
          variant="secondary"
          onClick={downloadQRCode}
          prefixIcon="download"
        >
          Скачать QR
        </Button>
        <Button
          variant="tertiary"
          onClick={copyARLink}
          prefixIcon="openLink"
        >
          Копировать ссылку
        </Button>
      </Row>

      {/* Информация о модели */}
      <Row gap="l" align="center" wrap>
        <Column gap="xs" align="center">
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Размер файла
          </Text>
          <Text variant="body-strong-xs">
            {(model.fileSize / 1024 / 1024).toFixed(2)} МБ
          </Text>
        </Column>
        <Column gap="xs" align="center">
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Тип файла
          </Text>
          <Text variant="body-strong-xs">
            {model.fileType.split('/')[1]?.toUpperCase() || 'GLB'}
          </Text>
        </Column>
        <Column gap="xs" align="center">
          <Text variant="body-default-xs" onBackground="neutral-weak">
            Дата создания
          </Text>
          <Text variant="body-strong-xs">
            {model.createdAt.toLocaleDateString('ru-RU')}
          </Text>
        </Column>
      </Row>
    </Column>
  );
}
