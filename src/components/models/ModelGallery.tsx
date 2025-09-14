"use client";

import { useState, useMemo, useEffect } from "react";
import { Column, Row, Text, Button, Input, useToast } from "@once-ui-system/core";
import { ModelViewer } from "./ModelViewer";
import { ModelSidebar } from "./ModelSidebar";
import { ARUploader } from "../ar/ARUploader";
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
  const [isVRActive, setIsVRActive] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
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

  // Объединяем все модели для отображения
  const allModels = useMemo(() => {
    const convertedARModels = arModels.map(arModel => ({
      id: arModel.id,
      title: arModel.name,
      description: arModel.description || 'Загруженная AR модель',
      src: arModel.fileUrl,
      author: 'Пользователь',
      year: new Date(arModel.createdAt).getFullYear(),
      size: arModel.fileSize,
      tags: ['AR', 'Загружено'],
      isUserModel: true
    }));

    return [...models, ...convertedARModels];
  }, [models, arModels]);

  // Фильтруем модели по поиску
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return allModels;
    
    const query = searchQuery.toLowerCase();
    return allModels.filter(model => 
      model.title.toLowerCase().includes(query) ||
      model.description.toLowerCase().includes(query) ||
      model.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [allModels, searchQuery]);

  // Автоматически выбираем первую модель если текущая не найдена
  useEffect(() => {
    if (selectedModel && !filteredModels.find(m => m.id === selectedModel.id)) {
      if (filteredModels.length > 0) {
        setSelectedModel(filteredModels[0]);
      } else if (filteredModels.length === 0) {
        setSelectedModel(null);
      }
    }
  }, [filteredModels, selectedModel]);


  const handleVREnter = () => {
    setIsVRActive(true);
    console.log("Вход в VR режим");
  };

  const handleAREnter = () => {
    setIsARActive(true);
    console.log("Вход в AR режим");
  };

  const handleFullscreen = () => {
    console.log("Полноэкранный режим");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleQRCodeClick = (model: Model3D) => {
    if (model.isUserModel) {
      const arUrl = `${window.location.origin}/ar/view/${model.id}`;
      navigator.clipboard.writeText(arUrl);
      alert('QR код скопирован в буфер обмена!');
    }
  };

  const handleDeleteModel = (model: Model3D) => {
    if (model.isUserModel) {
      handleARModelDelete(model.id);
    }
  };

  return (
    <Column gap="xl" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
      {/* Заголовок */}
      <Column gap="m" align="center" style={{ width: '100%' }}>
        <Text 
          variant="heading-strong-xl" 
          align="center"
          style={{ 
            fontWeight: '200',
            letterSpacing: '0.1em'
          }}
        >
          Интерактивная галерея
        </Text>
        
        {/* Серая линия под заголовком */}
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: '#333',
            margin: '16px 0'
          }}
        />
        
        <Text 
          variant="heading-strong-l" 
          align="center"
          style={{ 
            fontWeight: '300',
            letterSpacing: '0.05em'
          }}
        >
          3D модели
        </Text>
      </Column>

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

      {/* Основной контент - макет как на Sketchfab */}
      {filteredModels.length > 0 && selectedModel ? (
        <Row gap="xl" style={{ width: '100%', maxWidth: '1400px', alignItems: 'flex-start' }}>
          {/* Левая часть - 3D Viewer и информация */}
          <Column gap="l" style={{ flex: 1, maxWidth: '800px', height: '600px' }} align="center">
            {/* Кнопка загрузки AR моделей - над вьювером */}
            <Row gap="m" align="start" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setShowUploader(!showUploader)}
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  height: 'auto',
                  minHeight: '28px'
                }}
              >
                {showUploader ? "Скрыть" : "Загрузить!"}
              </Button>
            </Row>
            
            {/* 3D Viewer */}
            <div style={{ flex: 1, width: '100%' }}>
              <ModelViewer
                model={selectedModel}
                onVREnter={handleVREnter}
                onAREnter={handleAREnter}
                onFullscreen={handleFullscreen}
              />
            </div>
          </Column>

          {/* Правая часть - боковая панель с моделями */}
          <Column gap="l" style={{ width: '300px', minWidth: '300px', height: '600px' }} align="start">
            {/* AR Uploader */}
            {showUploader && (
              <ARUploader 
                onModelUpload={handleARModelUpload} 
                ngrokUrl="" 
              />
            )}

            {/* Список всех моделей с миниатюрами */}
            <ModelSidebar
              models={filteredModels}
              selectedModel={selectedModel}
              onModelSelect={handleModelSelect}
              onQRCodeClick={handleQRCodeClick}
              onDeleteModel={handleDeleteModel}
            />
          </Column>
        </Row>
      ) : (
        <Column gap="l" align="center" style={{ padding: '40px' }}>
          <Text variant="heading-strong-m" align="center">
            Модели не найдены
          </Text>
          <Text variant="body-default-m" align="center" onBackground="neutral-weak">
            Попробуйте изменить поисковый запрос или загрузите новую модель
          </Text>
        </Column>
      )}
    </Column>
  );
}