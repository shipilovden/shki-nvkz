"use client";

import { useState, useMemo, useEffect } from "react";
import { Column, Row, Text, Button, Input } from "@once-ui-system/core";
import { ModelViewer } from "./ModelViewer";
import { ModelSidebar } from "./ModelSidebar";
import type { Model3D } from "@/types/models.types";

interface ModelGalleryProps {
  models: Model3D[];
}

export function ModelGallery({ models }: ModelGalleryProps) {
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(models.length > 0 ? models[0] : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVRActive, setIsVRActive] = useState(false);
  const [isARActive, setIsARActive] = useState(false);

  // Фильтрация моделей
  const filteredModels = useMemo(() => {
    let filtered = models;

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
  }, [models, searchQuery]);

  const handleModelSelect = (model: Model3D) => {
    setSelectedModel(model);
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
            <ModelSidebar
              models={filteredModels}
              selectedModel={selectedModel}
              onModelSelect={handleModelSelect}
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
