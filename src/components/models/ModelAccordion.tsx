"use client";

import React, { useState } from 'react';
import { Column, Row, Text, Icon } from '@once-ui-system/core';
import { Model3D } from '@/types/models.types';
import styles from './ModelAccordion.module.css';

interface ModelAccordionProps {
  models: Model3D[];
  selectedModel: Model3D | null;
  onModelSelect: (model: Model3D) => void;
  onQRCodeClick?: (model: Model3D) => void;
  onDeleteModel?: (model: Model3D) => void;
}

export function ModelAccordion({
  models,
  selectedModel,
  onModelSelect,
  onQRCodeClick,
  onDeleteModel
}: ModelAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (models.length === 0) {
    return null;
  }

  return (
    <div className={styles.accordion}>
      {/* Заголовок аккордеона */}
      <div 
        className={styles.accordionHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Text variant="body-strong-xs" className={styles.accordionTitle}>
          Модели
        </Text>
        <Icon 
          name="chevronDown" 
          size="s" 
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
        />
      </div>

      {/* Содержимое аккордеона */}
      <div className={`${styles.accordionContent} ${isExpanded ? styles.accordionContentExpanded : ''} accordion-content`}>
        <div className={styles.modelsGrid}>
          {models.map((model) => (
            <div
              key={model.id}
              className={`${styles.modelCard} ${selectedModel?.id === model.id ? styles.modelCardSelected : ''}`}
              onClick={() => onModelSelect(model)}
            >
              {/* Кнопки управления */}
              {model.isUserModel && (
                <div className={styles.modelControls}>
                  {onQRCodeClick && (
                    <button
                      className={styles.controlButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onQRCodeClick(model);
                      }}
                      title="QR код"
                    >
                      QR
                    </button>
                  )}
                  {onDeleteModel && (
                    <button
                      className={styles.controlButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteModel(model);
                      }}
                      title="Удалить"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {/* Мини-вьювер */}
              <div className={styles.modelThumbnail}>
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
              </div>

              {/* Информация о модели */}
              <div className={styles.modelInfo}>
                <Text 
                  variant="body-strong-xs"
                  className={styles.modelTitle}
                >
                  {model.title}
                </Text>
                <Text 
                  variant="body-default-xs" 
                  className={styles.modelAuthor}
                >
                  {model.author}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
