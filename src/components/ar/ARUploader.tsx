"use client";

import { useState, useRef } from "react";
import { Column, Row, Text, Button, Icon, useToast } from "@once-ui-system/core";
import type { ARUploaderProps, ARModel } from "@/types/ar.types";
import { arStorage, type ARModelData } from "@/utils/arStorage";

export function ARUploader({ onModelUpload, ngrokUrl }: ARUploaderProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const generateQRCode = async (arUrl: string): Promise<string> => {
    // Используем QR Server API для генерации QR кода
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(arUrl)}`;
    return qrUrl;
  };

  const generateARUrl = (modelId: string): string => {
    // Генерируем уникальную ссылку для AR модели
    const baseUrl = window.location.origin;
    
    // Если это localhost и есть ngrok URL, используем его
    if ((baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) && ngrokUrl) {
      return `${ngrokUrl}/ar/view/${modelId}`;
    }
    
    // Если это localhost без ngrok URL, показываем инструкцию
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      return `${baseUrl}/ar/setup?modelId=${modelId}`;
    }
    
    return `${baseUrl}/ar/view/${modelId}`;
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Проверяем тип файла
    const allowedTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isGLB = fileExtension === 'glb';
    const isGLTF = fileExtension === 'gltf';

    if (!isGLB && !isGLTF) {
      addToast({
        variant: "danger",
        message: "Поддерживаются только файлы GLB и GLTF",
      });
      return;
    }

    // Проверяем размер файла (максимум 50 МБ)
    const maxSize = 50 * 1024 * 1024; // 50 МБ
    if (file.size > maxSize) {
      addToast({
        variant: "danger",
        message: "Размер файла не должен превышать 50 МБ",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Конвертируем файл в base64 для постоянного хранения
      const fileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Генерируем уникальный ID
      const modelId = `ar-model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Генерируем AR URL
      const arUrl = generateARUrl(modelId);
      
      // Генерируем QR код
      const qrCodeUrl = await generateQRCode(arUrl);

      // Создаем модель
      const model: ARModel = {
        id: modelId,
        name: file.name.replace(/\.[^/.]+$/, ""), // Убираем расширение
        description: `3D модель ${file.name}`,
        file: file,
        fileUrl: fileUrl,
        qrCodeUrl: qrCodeUrl,
        arUrl: arUrl,
        createdAt: new Date(),
        fileSize: file.size,
        fileType: file.type || (isGLB ? 'model/gltf-binary' : 'model/gltf+json')
      };

      // Сохраняем модель в IndexedDB
      try {
        if (arStorage.isSupported()) {
          const modelData: ARModelData = {
            id: model.id,
            name: model.name,
            description: model.description,
            fileUrl: model.fileUrl,
            qrCodeUrl: model.qrCodeUrl,
            arUrl: model.arUrl,
            createdAt: model.createdAt.toISOString(),
            fileSize: model.fileSize,
            fileType: model.fileType
          };
          await arStorage.saveModel(modelData);
        } else {
          // Fallback к localStorage для старых браузеров
          const existingModels = localStorage.getItem('arModels');
          const models = existingModels ? JSON.parse(existingModels) : [];
          models.push(model);
          localStorage.setItem('arModels', JSON.stringify(models));
        }
      } catch (error) {
        console.error('Ошибка сохранения модели:', error);
        addToast({
          variant: "danger",
          message: "Ошибка сохранения модели",
        });
      }

      onModelUpload(model);

      addToast({
        variant: "success",
        message: `Модель "${model.name}" успешно загружена!`,
      });

    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      addToast({
        variant: "danger",
        message: "Ошибка при загрузке файла",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Column 
      gap="l" 
      padding="xl"
      style={{
        width: '100%',
        border: '2px dashed var(--color-neutral-alpha-strong)',
        borderRadius: '12px',
        backgroundColor: 'var(--color-neutral-alpha-weak)',
        transition: 'all 0.3s ease',
        borderColor: isDragging ? 'var(--color-brand-medium)' : 'var(--color-neutral-alpha-strong)',
        backgroundColor: isDragging ? 'var(--color-brand-alpha-weak)' : 'var(--color-neutral-alpha-weak)'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      align="center"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      <Column gap="m" align="center">
        <Icon 
          name="package" 
          size="l" 
          onBackground="neutral-medium"
          style={{ fontSize: '48px' }}
        />
        
        <Text variant="heading-strong-m" align="center">
          Загрузите 3D модель
        </Text>
        
        <Text variant="body-default-s" onBackground="neutral-weak" align="center">
          Перетащите файл GLB или GLTF сюда, или нажмите кнопку для выбора
        </Text>
      </Column>

      <Row gap="m" align="center">
        <Button
          variant="primary"
          onClick={openFileDialog}
          disabled={isUploading}
          prefixIcon="package"
        >
          {isUploading ? "Загрузка..." : "Выбрать файл"}
        </Button>
      </Row>

      <Column gap="s" align="center">
        <Text variant="body-default-xs" onBackground="neutral-weak" align="center">
          Поддерживаемые форматы: GLB, GLTF
        </Text>
        <Text variant="body-default-xs" onBackground="neutral-weak" align="center">
          Максимальный размер: 50 МБ
        </Text>
      </Column>
    </Column>
  );
}
