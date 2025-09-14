"use client";

import { useState, useMemo, useEffect } from "react";
import { Column, Row, Text, Input, Button, useToast } from "@once-ui-system/core";
import { ModelGrid } from "./ModelGrid";
import { arStorage, type ARModelData } from "@/utils/arStorage";
import type { Model3D } from "@/types/models.types";
import type { ARModel } from "@/types/ar.types";

interface ModelGalleryProps {
  models: Model3D[];
}

export function ModelGallery({ models }: ModelGalleryProps) {
  const { addToast } = useToast();
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(models.length > 0 ? models[0] : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [arModels, setArModels] = useState<ARModel[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  // Загружаем AR модели при монтировании
  useEffect(() => {
    const loadARModels = async () => {
      try {
        if (arStorage.isSupported()) {
          const modelDataList = await arStorage.getAllModels();
          const convertedModels = modelDataList.map(modelData => ({
            id: modelData.id,
            name: modelData.name,
            description: modelData.description,
            fileUrl: modelData.fileUrl,
            fileSize: modelData.fileSize,
            fileType: modelData.fileType,
            createdAt: modelData.createdAt
          }));
          setArModels(convertedModels);
        } else {
          // Fallback к localStorage
          const storedModels = localStorage.getItem('arModels');
          if (storedModels) {
            const models = JSON.parse(storedModels);
            const convertedModels = models.map((model: any) => ({
              id: model.id,
              name: model.name,
              description: model.description,
              fileUrl: model.fileUrl,
              fileSize: model.fileSize,
              fileType: model.fileType,
              createdAt: model.createdAt
            }));
            setArModels(convertedModels);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки AR моделей:', error);
      }
    };
    loadARModels();
  }, []);

  const handleModelSelect = (model: Model3D) => {
    setSelectedModel(model);
  };

  const handleARModelUpload = (model: ARModel) => {
    setArModels(prev => [...prev, model]);
    addToast({
      variant: "success",
      message: `AR модель "${model.name}" загружена!`,
    });
  };

  const handleARModelDelete = async (modelId: string) => {
    try {
      // Удаляем из IndexedDB
      if (arStorage.isSupported()) {
        await arStorage.deleteModel(modelId);
      } else {
        // Fallback к localStorage
        const storedModels = localStorage.getItem('arModels');
        if (storedModels) {
          const models = JSON.parse(storedModels);
          const filteredModels = models.filter((model: any) => model.id !== modelId);
          localStorage.setItem('arModels', JSON.stringify(filteredModels));
        }
      }

      // Удаляем с сервера
      try {
        await fetch(`/api/ar/models/${modelId}`, {
          method: 'DELETE',
        });
      } catch (serverError) {
        console.warn('Не удалось удалить модель с сервера:', serverError);
      }

      // Обновляем локальное состояние
      setArModels(prev => prev.filter(model => model.id !== modelId));
      
      addToast({
        variant: "success",
        message: "Модель удалена!",
      });
    } catch (error) {
      console.error('Ошибка удаления модели:', error);
      addToast({
        variant: "danger",
        message: "Ошибка при удалении модели",
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Column gap="xl" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
      {/* Поиск - отцентрирован */}
      <Column gap="m" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
        <Row gap="m" vertical="center" align="center" style={{ width: '100%', justifyContent: 'center' }}>
          <Input
            placeholder="Поиск по названию, описанию, тегам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, maxWidth: '500px' }}
          />
          {searchQuery && (
            <Button variant="secondary" size="s" onClick={clearSearch}>
              Очистить
            </Button>
          )}
        </Row>
      </Column>

      {/* Основной контент - сетка моделей */}
      <div style={{ width: '100%', maxWidth: '1400px' }}>
        <ModelGrid
          models={models}
          arModels={arModels}
          onModelSelect={handleModelSelect}
          onARModelUpload={handleARModelUpload}
          onARModelDelete={handleARModelDelete}
          searchQuery={searchQuery}
        />
      </div>
    </Column>
  );
}