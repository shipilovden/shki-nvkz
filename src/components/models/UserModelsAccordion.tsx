"use client";

import React, { useState } from 'react';
import { Column, Row, Text, Button, Icon } from '@once-ui-system/core';
import { Model3D } from '@/types/models.types';

interface UserModelsAccordionProps {
  userModels: Model3D[];
  selectedModel: Model3D | null;
  onModelSelect: (model: Model3D) => void;
  onQRCodeClick: (model: Model3D) => void;
  onDeleteModel: (model: Model3D) => void;
}

export function UserModelsAccordion({
  userModels,
  selectedModel,
  onModelSelect,
  onQRCodeClick,
  onDeleteModel
}: UserModelsAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false); // По умолчанию свёрнут

  if (userModels.length === 0) {
    return null;
  }

  return (
    <Column gap="s" style={{ marginBottom: '16px' }}>
      {/* Заголовок аккордеона */}
      <Row
        gap="s"
        align="center"
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--color-neutral-alpha-weak)',
          borderRadius: '6px',
          cursor: 'pointer',
          border: '1px solid var(--neutral-alpha-strong)',
          transition: 'all 0.3s ease'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-neutral-alpha-medium)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-neutral-alpha-weak)';
        }}
      >
        <Icon 
          name="user" 
          size="s" 
          onBackground="neutral-medium"
          style={{ 
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.3s ease'
          }}
        />
        <Text variant="body-strong-s" style={{ color: 'var(--color-neutral-strong)' }}>
          Загруженные модели ({userModels.length})
        </Text>
        <Icon 
          name="chevronDown" 
          size="s" 
          onBackground="neutral-medium"
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            marginLeft: 'auto'
          }}
        />
      </Row>

      {/* Содержимое аккордеона */}
      {isExpanded && (
        <Column gap="s" style={{ paddingLeft: '16px' }}>
          {userModels.map((model) => (
            <div
              key={model.id}
              style={{
                position: 'relative',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: selectedModel?.id === model.id
                  ? 'var(--color-brand-alpha-strong)'
                  : 'var(--color-neutral-alpha-weak)',
                border: selectedModel?.id === model.id
                  ? '2px solid var(--color-brand-strong)'
                  : '1px solid var(--neutral-alpha-strong)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '60px',
                transform: 'translateY(0)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                padding: '6px'
              }}
              onClick={() => onModelSelect(model)}
              onMouseEnter={(e) => {
                if (selectedModel?.id !== model.id) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--neutral-alpha-strong)';
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-alpha-medium)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedModel?.id !== model.id) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--neutral-alpha-strong)';
                  e.currentTarget.style.backgroundColor = 'var(--color-neutral-alpha-weak)';
                }
              }}
            >
              {/* Кнопки в верхнем правом углу */}
              <div style={{ 
                position: 'absolute', 
                top: '2px', 
                right: '2px', 
                display: 'flex', 
                gap: '2px',
                zIndex: 10
              }}>
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQRCodeClick(model);
                  }}
                  style={{ 
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 2px',
                    fontSize: '6px',
                    backgroundColor: 'var(--color-neutral-alpha-medium)',
                    color: 'var(--color-neutral-strong)',
                    border: 'none'
                  }}
                >
                  QR
                </Button>
                <Button
                  variant="tertiary"
                  size="s"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteModel(model);
                  }}
                  style={{ 
                    minWidth: '16px',
                    height: '16px',
                    padding: '0',
                    fontSize: '10px',
                    backgroundColor: 'var(--color-neutral-alpha-medium)',
                    color: 'var(--color-neutral-strong)',
                    border: 'none'
                  }}
                >
                  ×
                </Button>
              </div>

              <Row gap="s" vertical="center" style={{ height: '100%' }}>
                {/* Мини-вьювер */}
                <div
                  style={{
                    width: '50px',
                    height: '40px',
                    backgroundColor: 'var(--color-neutral-alpha-strong)',
                    borderRadius: '4px',
                    border: '1px solid var(--neutral-alpha-strong)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {model.isSketchfab ? (
                    // Для Sketchfab моделей используем iframe
                    <iframe
                      src={model.src}
                      title={model.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                      allow="autoplay; fullscreen; xr-spatial-tracking"
                    />
                  ) : (
                    // Для обычных моделей используем model-viewer
                    <model-viewer
                      src={model.src}
                      alt={model.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'var(--color-neutral-alpha-weak)'
                      }}
                      camera-controls
                      auto-rotate
                      exposure="1.0"
                      shadow-intensity="0.5"
                      loading="eager"
                      animation-name=""
                      autoplay
                      animation-crossfade-duration="300"
                    />
                  )}
                </div>

                {/* Информация о модели */}
                <Column gap="xs" style={{ flex: 1, minWidth: 0 }}>
                  <Text 
                    variant="body-strong-xs"
                    style={{ 
                      color: selectedModel?.id === model.id
                        ? 'var(--color-brand-medium)'
                        : 'var(--color-neutral-strong)',
                      fontSize: '12px',
                      lineHeight: '1.2',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
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
                      fontSize: '10px',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {model.author}
                  </Text>
                </Column>
              </Row>
            </div>
          ))}
        </Column>
      )}
    </Column>
  );
}
