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

  // Объединяем 3D и AR модели для отображения в viewer
  const allModels = useMemo(() => {
    // Конвертируем AR модели в формат 3D моделей
    const convertedARModels = arModels.map(arModel => ({
      id: arModel.id,
      title: arModel.name,
      description: arModel.description,
      src: arModel.fileUrl, // ModelSidebar ожидает поле src
      modelUrl: arModel.fileUrl,
      thumbnailUrl: arModel.qrCodeUrl, // Используем QR код как превью
      author: "Пользователь",
      year: new Date(arModel.createdAt).getFullYear().toString(),
      size: `${(arModel.fileSize / 1024 / 1024).toFixed(1)} МБ`,
      tags: ["AR", "Пользовательская"],
      vrEnabled: true,
      arEnabled: true,
      isUserModel: true // Флаг для пользовательских моделей
    }));

    return [...models, ...convertedARModels];
  }, [models, arModels]);

  // Фильтрация моделей
  const filteredModels = useMemo(() => {
    let filtered = allModels;

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(model => 
        model.title.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.tags.some(tag => tag.toLowerCase().includes(query)) ||
        model.author?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allModels, searchQuery]);

  // Загружаем AR модели при инициализации
  useEffect(() => {
    const loadARModels = async () => {
      try {
        if (arStorage.isSupported()) {
          const models = await arStorage.getAllModels();
          const convertedModels: ARModel[] = models.map((modelData: ARModelData) => ({
            id: modelData.id,
            name: modelData.name,
            description: modelData.description,
            fileUrl: modelData.fileUrl,
            qrCodeUrl: modelData.qrCodeUrl,
            arUrl: modelData.arUrl,
            createdAt: new Date(modelData.createdAt),
            fileSize: modelData.fileSize,
            fileType: modelData.fileType,
            file: null
          }));
          setArModels(convertedModels);
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
      if (selectedModel?.id === modelId) {
        setSelectedModel(null);
      }

      addToast({
        variant: "success",
        message: "Модель удалена",
      });
    } catch (error) {
      console.error('Ошибка удаления модели:', error);
      addToast({
        variant: "danger",
        message: "Ошибка удаления модели",
      });
    }
  };

  // Обновляем выбранную модель при изменении фильтров
  useEffect(() => {
    if (filteredModels.length > 0 && (!selectedModel || !filteredModels.find(m => m.id === selectedModel.id))) {
      setSelectedModel(filteredModels[0]);
    } else if (filteredModels.length === 0) {
      setSelectedModel(null);
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
            backgroundColor: '#ddd',
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
        <Row gap="xl" style={{ width: '100%', maxWidth: '1400px' }} align="start">
          {/* Левая часть - 3D Viewer и информация */}
          <Column gap="l" style={{ flex: 1, maxWidth: '800px' }} align="center">
            {/* 3D Viewer */}
            <ModelViewer
              model={selectedModel}
              onVREnter={handleVREnter}
              onAREnter={handleAREnter}
              onFullscreen={handleFullscreen}
            />
          </Column>

          {/* Правая часть - боковая панель с моделями */}
          <Column gap="l" style={{ width: '300px', minWidth: '300px' }} align="start">
            {/* Кнопка загрузки AR моделей */}
            <Button
              variant="primary"
              size="s"
              onClick={() => setShowUploader(!showUploader)}
              prefixIcon="upload"
              style={{ 
                width: '100%',
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '6px'
              }}
            >
              {showUploader ? "Скрыть" : "Загрузить!"}
            </Button>

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
              onQRCodeClick={(model) => {
                // Находим оригинальную AR модель
                const arModel = arModels.find(ar => ar.id === model.id);
                if (arModel) {
                  window.open(arModel.qrCodeUrl, '_blank');
                }
              }}
              onDeleteModel={handleARModelDelete}
            />
          </Column>
        </Row>
      ) : (
        /* Пустое состояние */
        <Column align="center" gap="l" padding="xl">
          <Text variant="heading-strong-m" align="center">
            Модели не найдены
          </Text>
          <Text variant="body-default-m" onBackground="neutral-weak" align="center">
            Попробуйте изменить критерии поиска или выбрать другую категорию
          </Text>
          <Button variant="secondary" onClick={() => {
            setSearchQuery("");
          }}>
            Сбросить фильтры
          </Button>
        </Column>
      )}

      {/* Блок 3D миры */}
      <Column gap="l" align="center" style={{ width: '100%', maxWidth: '1400px' }}>
        <Text 
          variant="heading-strong-l" 
          align="center"
          style={{ 
            fontWeight: '300',
            letterSpacing: '0.05em'
          }}
        >
          3D миры
        </Text>
        
        {/* Заглушка для 3D миров */}
        <Column 
          gap="m" 
          padding="xl"
          style={{
            backgroundColor: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #ddd',
            width: '100%',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          align="center"
        >
          <Text variant="body-default-m" onBackground="neutral-medium" align="center">
            Скоро здесь будут 3D миры
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak" align="center">
            Интерактивные сцены и окружения
          </Text>
        </Column>
      </Column>

      {/* VR/AR статус */}
      {(isVRActive || isARActive) && (
        <Column 
          gap="m" 
          padding="l"
          style={{
            backgroundColor: 'var(--color-brand-alpha-weak)',
            borderRadius: '12px',
            border: '1px solid var(--color-brand-alpha-medium)'
          }}
          align="center"
        >
          <Text variant="body-strong-m" onBackground="brand-medium">
            {isVRActive ? "🥽 VR режим активен" : "📱 AR режим активен"}
          </Text>
          <Text variant="body-default-s" onBackground="brand-weak" align="center">
            {isVRActive 
              ? "Используйте VR гарнитуру для иммерсивного просмотра"
              : "Наведите камеру на поверхность для размещения модели"
            }
          </Text>
        </Column>
      )}
    </Column>
  );
}
