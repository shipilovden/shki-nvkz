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

    // Проверяем размер файла (максимум 10 МБ)
    const maxSize = 10 * 1024 * 1024; // 10 МБ
    if (file.size > maxSize) {
      addToast({
        variant: "danger",
        message: "Размер файла не должен превышать 10 МБ",
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

      // Сохраняем модель в IndexedDB и на сервер
      try {
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

        // Сохраняем в IndexedDB для локального использования
        if (arStorage.isSupported()) {
          await arStorage.saveModel(modelData);
        } else {
          // Fallback к localStorage для старых браузеров
          const existingModels = localStorage.getItem('arModels');
          const models = existingModels ? JSON.parse(existingModels) : [];
          models.push(model);
          localStorage.setItem('arModels', JSON.stringify(models));
        }

        // Сохраняем на сервер для доступа через QR код
        try {
          console.log('Сохраняем модель на сервер:', model.id, modelData);
          const response = await fetch(`/api/ar/models/${model.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(modelData),
          });

          console.log('Ответ сервера при сохранении:', response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка сохранения на сервер:', response.status, errorText);
            addToast({
              variant: "danger",
              message: `Ошибка сохранения на сервер: ${response.status}`,
            });
          } else {
            console.log('Модель успешно сохранена на сервер');
          }
        } catch (serverError) {
          console.error('Ошибка сохранения на сервер:', serverError);
          addToast({
            variant: "danger",
            message: "Ошибка сохранения на сервер",
          });
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
    <div
      style={{
        width: '100%',
        border: '2px dashed #ddd',
        borderRadius: '8px',
        backgroundColor: isDragging ? '#f0f8ff' : '#fafafa',
        transition: 'all 0.3s ease',
        borderColor: isDragging ? '#007bff' : '#ddd',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFileDialog}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      <Icon 
        name="package" 
        size="m" 
        onBackground="neutral-medium"
        style={{ fontSize: '24px', marginBottom: '8px' }}
      />
      
      <Text variant="body-default-s" style={{ fontSize: '12px', color: '#666' }}>
        {isUploading ? "Загрузка..." : "Перетащите файл или нажмите"}
      </Text>
    </div>
  );
}
