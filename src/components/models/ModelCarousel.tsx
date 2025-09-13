"use client";

import { useState, useRef, useEffect } from "react";
import { Column, Row, Text, Button, Icon, Media } from "@once-ui-system/core";
import type { Model3D } from "@/types/models.types";

interface ModelCarouselProps {
  models: Model3D[];
  selectedModel: Model3D | null;
  onModelSelect: (model: Model3D) => void;
}

export function ModelCarousel({ models, selectedModel, onModelSelect }: ModelCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Находим индекс выбранной модели
  useEffect(() => {
    if (selectedModel) {
      const index = models.findIndex(model => model.id === selectedModel.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [selectedModel, models]);

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : models.length - 1;
    setCurrentIndex(newIndex);
    onModelSelect(models[newIndex]);
  };

  const handleNext = () => {
    const newIndex = currentIndex < models.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onModelSelect(models[newIndex]);
  };

  const handleModelClick = (model: Model3D, index: number) => {
    setCurrentIndex(index);
    onModelSelect(model);
  };

  // Прокрутка карусели к выбранной модели
  useEffect(() => {
    if (carouselRef.current) {
      const itemWidth = 200; // Ширина элемента карусели
      const scrollPosition = currentIndex * itemWidth;
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  if (models.length === 0) {
    return (
      <Column align="center" gap="m" padding="l">
        <Icon name="3d" size="l" onBackground="neutral-medium" />
        <Text variant="body-default-m" onBackground="neutral-medium">
          Нет доступных моделей
        </Text>
      </Column>
    );
  }

  return (
    <Column gap="l" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
      {/* Навигация */}
      <Row fillWidth horizontal="between" vertical="center" style={{ maxWidth: '800px' }}>
        <Button
          variant="secondary"
          size="s"
          onClick={handlePrevious}
          prefixIcon="chevronLeft"
          disabled={models.length <= 1}
        >
          Предыдущая
        </Button>
        
        <Column align="center" gap="xs">
          <Text variant="body-strong-s">
            {currentIndex + 1} из {models.length}
          </Text>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            {selectedModel?.title || "Нет модели"}
          </Text>
        </Column>
        
        <Button
          variant="secondary"
          size="s"
          onClick={handleNext}
          prefixIcon="chevronRight"
          disabled={models.length <= 1}
        >
          Следующая
        </Button>
      </Row>

      {/* Карусель превью */}
      <div
        ref={carouselRef}
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          padding: '8px 0',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-neutral-medium) transparent',
          width: '100%',
          maxWidth: '800px',
          justifyContent: 'center'
        }}
      >
        {models.map((model, index) => (
          <Column
            key={model.id}
            style={{
              minWidth: '180px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: selectedModel?.id === model.id 
                ? 'var(--color-brand-alpha-weak)' 
                : 'transparent',
              border: selectedModel?.id === model.id 
                ? '2px solid var(--color-brand-medium)' 
                : '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleModelClick(model, index)}
          >
            {/* Превью изображение */}
            <div
              style={{
                width: '160px',
                height: '120px',
                backgroundColor: 'var(--color-neutral-alpha-weak)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                overflow: 'hidden'
              }}
            >
              {model.thumbnail ? (
                <Media
                  src={model.thumbnail}
                  alt={model.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Icon name="3d" size="m" onBackground="neutral-medium" />
              )}
            </div>

            {/* Информация о модели */}
            <Column gap="xs" align="center">
              <Text 
                variant="body-strong-xs" 
                align="center"
                style={{ 
                  color: selectedModel?.id === model.id 
                    ? 'var(--color-brand-medium)' 
                    : 'var(--color-neutral-strong)'
                }}
              >
                {model.title}
              </Text>
              <Text 
                variant="body-default-xs" 
                onBackground="neutral-weak"
                align="center"
                style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {model.description}
              </Text>
              
              {/* Теги */}
              <Row gap="xs" wrap align="center" style={{ justifyContent: 'center' }}>
                {model.tags.slice(0, 2).map((tag, tagIndex) => (
                  <Text 
                    key={tagIndex}
                    variant="body-default-xs" 
                    onBackground="neutral-medium"
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--color-neutral-alpha-medium)',
                      fontSize: '10px'
                    }}
                  >
                    {tag}
                  </Text>
                ))}
              </Row>

              {/* VR/AR индикаторы */}
              <Row gap="xs" align="center">
                {model.vrEnabled && (
                  <Icon name="3d" size="xs" onBackground="brand-medium" />
                )}
                {model.arEnabled && (
                  <Icon name="rocket" size="xs" onBackground="brand-medium" />
                )}
              </Row>
            </Column>
          </Column>
        ))}
      </div>

      {/* Точки навигации */}
      {models.length > 1 && (
        <Row gap="xs" align="center" style={{ justifyContent: 'center' }}>
          {models.map((_, index) => (
            <button
              key={index}
              onClick={() => handleModelClick(models[index], index)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: index === currentIndex 
                  ? 'var(--color-brand-medium)' 
                  : 'var(--color-neutral-medium)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            />
          ))}
        </Row>
      )}
    </Column>
  );
}
