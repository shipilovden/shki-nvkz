"use client";

import { Column, Row, Text, Icon, Badge, Button } from "@once-ui-system/core";
import type { Model3D } from "@/types/models.types";

interface ModelSidebarProps {
  models: Model3D[];
  selectedModel: Model3D | null;
  onModelSelect: (model: Model3D) => void;
  onQRCodeClick?: (model: Model3D) => void;
  onDeleteModel?: (modelId: string) => void;
}

export function ModelSidebar({ models, selectedModel, onModelSelect, onQRCodeClick, onDeleteModel }: ModelSidebarProps) {
  if (models.length === 0) {
    return (
      <Column align="center" gap="m" padding="l">
        <Icon name="3d" size="l" onBackground="neutral-medium" />
        <Text variant="body-default-s" onBackground="neutral-medium">
          Нет доступных моделей
        </Text>
      </Column>
    );
  }

  return (
    <Column 
      gap="s" 
      style={{ 
        width: '100%',
        maxHeight: '500px', // Максимальная высота
        overflowY: 'auto',
        padding: '12px',
        border: '1px solid var(--neutral-alpha-strong)',
        borderRadius: '8px',
        backgroundColor: 'var(--color-neutral-alpha-strong)'
      }}
    >
      {models.map((model) => (
        <div
          key={model.id}
          style={{
            position: 'relative',
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: selectedModel?.id === model.id
              ? 'var(--color-brand-alpha-strong)'
              : 'var(--color-neutral-alpha-weak)', // Более светлый фон для видимости
            border: selectedModel?.id === model.id
              ? '2px solid var(--color-brand-strong)'
              : '1px solid var(--neutral-alpha-strong)', // Видимая граница
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '80px',
            transform: 'translateY(0)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '8px'
          }}
          onClick={() => onModelSelect(model)}
          onMouseEnter={(e) => {
            if (selectedModel?.id !== model.id) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.borderColor = 'var(--neutral-alpha-strong)';
              e.currentTarget.style.backgroundColor = 'var(--color-neutral-alpha-medium)'; // Светлеет при наведении
            }
          }}
          onMouseLeave={(e) => {
            if (selectedModel?.id !== model.id) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = 'var(--neutral-alpha-strong)';
              e.currentTarget.style.backgroundColor = 'var(--color-neutral-alpha-weak)'; // Возвращается к исходному цвету
            }
          }}
        >
          {/* Кнопки в верхнем правом углу */}
          {(model as any).isUserModel && (
            <div style={{ 
              position: 'absolute', 
              top: '4px', 
              right: '4px', 
              display: 'flex', 
              gap: '4px',
              zIndex: 10
            }}>
              {onQRCodeClick && (
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQRCodeClick(model);
                  }}
                  style={{ 
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 4px',
                    fontSize: '8px',
                    backgroundColor: 'var(--color-neutral-alpha-medium)',
                    color: 'var(--color-neutral-strong)',
                    border: '1px solid var(--neutral-alpha-strong)'
                  }}
                >
                  QR
                </Button>
              )}
              {onDeleteModel && (
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteModel(model.id);
                  }}
                  style={{ 
                    minWidth: '20px',
                    height: '20px',
                    padding: '0',
                    fontSize: '12px',
                    backgroundColor: 'var(--color-neutral-alpha-medium)',
                    color: 'var(--color-neutral-strong)',
                    border: '1px solid var(--neutral-alpha-strong)'
                  }}
                >
                  ×
                </Button>
              )}
            </div>
          )}

          <Row
            gap="s"
            vertical="center"
            style={{ height: '100%' }}
          >
          {/* Мини-вьювер 3D модели */}
          <div
            style={{
              width: '80px',
              height: '60px',
              backgroundColor: 'var(--color-neutral-alpha-medium)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--color-neutral-strong)' // Более светлая обводка для мини-вьюверов
            }}
          >
            <model-viewer
              src={model.src}
              style={{
                width: '100%',
                height: '100%',
                '--poster-color': 'transparent',
                '--progress-bar-color': 'var(--color-brand-medium)',
                '--progress-mask': 'var(--color-neutral-alpha-weak)'
              }}
              camera-controls
              auto-rotate
              interaction-policy="allow-when-focused"
              disable-zoom
              disable-pan
              disable-tap
              camera-orbit="0deg 75deg 1.5m"
              field-of-view="30deg"
              min-camera-orbit="auto auto 1m"
              max-camera-orbit="auto auto 2m"
              min-field-of-view="20deg"
              max-field-of-view="40deg"
            />
          </div>
          
          <Column flex={1} gap="xs">
            <Text
              variant="body-strong-s"
              style={{
                color: selectedModel?.id === model.id
                  ? 'var(--color-brand-medium)'
                  : 'var(--color-neutral-strong)',
                fontSize: '14px',
                lineHeight: '1.2',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {model.title}
            </Text>
            <Text 
              variant="body-default-xs" 
              onBackground="neutral-weak"
              style={{ 
                fontSize: '12px',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {model.author}
            </Text>
            <Row gap="xs" align="center">
              {model.vrEnabled && (
                <Icon name="3d" size="xs" onBackground="brand-medium" />
              )}
              {model.arEnabled && (
                <Icon name="rocket" size="xs" onBackground="brand-medium" />
              )}
            </Row>
            
          </Column>
          </Row>
        </div>
      ))}
    </Column>
  );
}