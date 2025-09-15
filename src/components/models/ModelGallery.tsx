"use client";

import { useState, useMemo, useEffect } from "react";
import { Column, Row, Text, Button, Input, useToast, Icon } from "@once-ui-system/core";
import { ModelViewer } from "./ModelViewer";
import { ModelSidebar } from "./ModelSidebar";
import { ARUploader } from "../ar/ARUploader";
import { SketchfabLoader } from "./SketchfabLoader";
import { SketchfabAccordion } from "./SketchfabAccordion";
import { arStorage, type ARModelData } from "@/utils/arStorage";
import type { Model3D } from "@/types/models.types";
import type { ARModel } from "@/types/ar.types";
import styles from './ModelGallery.module.css';

interface ModelGalleryProps {
  models: Model3D[];
}

export function ModelGallery({ models }: ModelGalleryProps) {
  const { addToast } = useToast();
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(models.length > 0 ? models[0] : null);
  
  // Отладочная информация
  console.log('ModelGallery mounted with models:', models);
  console.log('Selected model:', selectedModel);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVRActive, setIsVRActive] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [arModels, setArModels] = useState<ARModel[]>([]);
  const [sketchfabModels, setSketchfabModels] = useState<Model3D[]>([]);
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

  const handleSketchfabModelLoad = (model: Model3D) => {
    console.log('Sketchfab model loaded:', model);
    
    // Добавляем модель в список Sketchfab моделей
    setSketchfabModels(prev => [...prev, model]);
    
    // Автоматически выбираем загруженную модель
    setSelectedModel(model);
    
    addToast({
      variant: "success",
      message: "Модель Sketchfab загружена!"
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

    // Добавляем флаг isUserModel для Sketchfab моделей
    const convertedSketchfabModels = sketchfabModels.map(model => ({
      ...model,
      isUserModel: true
    }));

    return [...models, ...convertedARModels, ...convertedSketchfabModels];
  }, [models, arModels, sketchfabModels]);

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
    <Column gap="xl" className="model-gallery-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '200px', paddingBottom: '40px' }} align="center">
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

      {/* Основной контент - адаптивный макет */}
      {(() => {
        console.log('Rendering check:', { 
          filteredModelsLength: filteredModels.length, 
          selectedModel: selectedModel,
          hasSelectedModel: !!selectedModel 
        });
        return filteredModels.length > 0 && selectedModel;
      })() ? (
        <>
          {/* Десктопная версия - горизонтальный макет */}
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '1400px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start', 
              height: '600px', // Увеличена высота для десктопа
              gap: '24px'
            }}
            className={styles.desktopLayout}
          >
            {/* Левая часть - 3D Viewer и информация */}
            <Column gap="l" style={{ flex: 1, maxWidth: '800px', height: '100%' }} align="center">
              {/* Кнопка загрузки AR моделей и Sketchfab загрузчик - над вьювером */}
              <Column gap="s" style={{ width: '100%', justifyContent: 'flex-start' }}>
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
                
                {/* Sketchfab загрузчик */}
                <SketchfabLoader onModelLoad={handleSketchfabModelLoad} />
                
                {/* Информация о AR для Sketchfab */}
                <Row 
                  gap="s" 
                  align="center" 
                  style={{ 
                    padding: '6px 10px',
                    backgroundColor: 'var(--color-info-alpha-weak)',
                    border: '1px solid var(--color-info-alpha-strong)',
                    borderRadius: '4px',
                    marginTop: '4px'
                  }}
                >
                  <Icon name="info" size="xs" onBackground="info-medium" />
                  <Text variant="body-default-xs" onBackground="info-medium">
                    Sketchfab модели с API токеном поддерживают AR! Если AR недоступен, загрузите GLB/GLTF файл выше.
                  </Text>
                </Row>
              </Column>
              
              {/* 3D Viewer */}
              <div style={{ flex: 1, width: '100%', minHeight: '500px' }}>
                <ModelViewer
                  model={selectedModel}
                  onVREnter={handleVREnter}
                  onAREnter={handleAREnter}
                  onFullscreen={handleFullscreen}
                />
              </div>
            </Column>

            {/* Правая часть - боковая панель с моделями */}
            <Column gap="l" style={{ width: '300px', minWidth: '300px', height: '100%' }} align="start">
              {/* AR Uploader - фиксированная высота */}
              {showUploader && (
                <div style={{ height: '80px', marginBottom: '16px' }}>
                  <ARUploader 
                    onModelUpload={handleARModelUpload} 
                    ngrokUrl="" 
                  />
                </div>
              )}

              {/* Список всех моделей с миниатюрами - всегда на одном уровне */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: showUploader ? 'calc(100% - 96px)' : '100%' }}>
                <ModelSidebar
                  models={filteredModels}
                  selectedModel={selectedModel}
                  onModelSelect={handleModelSelect}
                  onQRCodeClick={handleQRCodeClick}
                  onDeleteModel={handleDeleteModel}
                />
              </div>
            </Column>
          </div>

          {/* Мобильная версия - вертикальный макет */}
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '1400px',
              display: 'none',
              flexDirection: 'column',
              gap: '16px'
            }}
            className={styles.mobileLayout}
          >
            {/* Кнопка загрузки AR моделей и Sketchfab загрузчик */}
            <Column gap="s" style={{ width: '100%', justifyContent: 'flex-start' }}>
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
              
              {/* Sketchfab загрузчик */}
              <SketchfabLoader onModelLoad={handleSketchfabModelLoad} />
            </Column>

            {/* AR Uploader */}
            {showUploader && (
              <div style={{ width: '100%', marginBottom: '16px' }}>
                <ARUploader 
                  onModelUpload={handleARModelUpload} 
                  ngrokUrl="" 
                />
              </div>
            )}

            {/* 3D Viewer - адаптивный размер */}
            <div style={{ width: '100%', minHeight: '400px' }}>
              <ModelViewer
                model={selectedModel}
                onVREnter={handleVREnter}
                onAREnter={handleAREnter}
                onFullscreen={handleFullscreen}
              />
            </div>

            {/* Список моделей - адаптивный размер */}
            <div style={{ width: '100%' }}>
              <ModelSidebar
                models={filteredModels}
                selectedModel={selectedModel}
                onModelSelect={handleModelSelect}
                onQRCodeClick={handleQRCodeClick}
                onDeleteModel={handleDeleteModel}
              />
            </div>
          </div>
        </>
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

      {/* Sketchfab поиск - добавляем под основным контентом */}
      <Column gap="l" style={{ width: '100%', maxWidth: '1200px', marginTop: '40px' }} align="center">
        <Text 
          variant="heading-strong-l" 
          align="center"
          style={{ 
            fontWeight: '300',
            letterSpacing: '0.05em'
          }}
        >
          Поиск на Sketchfab
        </Text>
        
        <SketchfabAccordion onModelSelect={handleModelSelect} />
      </Column>
    </Column>
  );
}