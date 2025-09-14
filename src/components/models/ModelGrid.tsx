"use client";

import React, { useState, useMemo } from 'react';
import { Column, Row, Text, Button, Badge } from '@once-ui-system/core';
import { Model3D } from '@/types/models.types';
import { ARModel } from '@/types/ar.types';
import { ARUploader } from '@/components/ar/ARUploader';
import { arStorage } from '@/utils/arStorage';

interface ModelGridProps {
  models: Model3D[];
  arModels: ARModel[];
  onModelSelect: (model: Model3D) => void;
  onARModelUpload: (model: ARModel) => void;
  onARModelDelete: (modelId: string) => void;
  searchQuery: string;
}

export const ModelGrid: React.FC<ModelGridProps> = ({
  models,
  arModels,
  onModelSelect,
  onARModelUpload,
  onARModelDelete,
  searchQuery
}) => {
  const [showUploader, setShowUploader] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);

  // Объединяем все модели
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

  const handleModelClick = (model: Model3D) => {
    setSelectedModel(model);
    onModelSelect(model);
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
      onARModelDelete(model.id);
    }
  };

  return (
    <Column gap="xl" style={{ width: '100%' }}>
      {/* Заголовок и кнопка загрузки */}
      <Row gap="l" align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text variant="heading-strong-xl" style={{ fontWeight: '200', letterSpacing: '0.1em' }}>
          Интерактивная галерея
        </Text>
        <Button
          variant="secondary"
          size="s"
          onClick={() => setShowUploader(!showUploader)}
          style={{
            fontSize: '12px',
            padding: '8px 16px',
            borderRadius: '6px'
          }}
        >
          {showUploader ? "Скрыть" : "Загрузить!"}
        </Button>
      </Row>

      {/* Серая линия */}
      <div style={{ width: '100%', height: '1px', backgroundColor: '#333', margin: '16px 0' }} />

      {/* AR Uploader */}
      {showUploader && (
        <div style={{ marginBottom: '24px' }}>
          <ARUploader onModelUpload={onARModelUpload} ngrokUrl="" />
        </div>
      )}

      {/* Сетка моделей */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          width: '100%'
        }}
      >
        {filteredModels.map((model) => (
          <div
            key={model.id}
            onClick={() => handleModelClick(model)}
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #333',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
              e.currentTarget.style.borderColor = '#555';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#333';
            }}
          >
            {/* Бейджи */}
            <Row gap="s" style={{ marginBottom: '12px' }}>
              {model.isUserModel && (
                <Badge variant="success" size="s">NEW</Badge>
              )}
              <Badge variant="secondary" size="s">
                {model.isUserModel ? 'AR' : '3D'}
              </Badge>
            </Row>

            {/* Миниатюра модели */}
            <div
              style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #333',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <model-viewer
                src={model.src}
                alt={model.title}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#1a1a1a'
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
            <Column gap="s">
              <Text variant="heading-strong-m" style={{ color: '#fff' }}>
                {model.title}
              </Text>
              <Text variant="body-default-s" style={{ color: '#aaa' }}>
                {model.description}
              </Text>
              <Row gap="m" align="center" style={{ marginTop: '8px' }}>
                <Text variant="body-default-xs" style={{ color: '#666' }}>
                  {model.author} • {model.year}
                </Text>
                <Text variant="body-default-xs" style={{ color: '#666' }}>
                  {model.size}
                </Text>
              </Row>
            </Column>

            {/* Кнопки управления для пользовательских моделей */}
            {model.isUserModel && (
              <Row gap="s" style={{ marginTop: '12px', justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQRCodeClick(model);
                  }}
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    minWidth: 'auto'
                  }}
                >
                  QR
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteModel(model);
                  }}
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    minWidth: 'auto'
                  }}
                >
                  ×
                </Button>
              </Row>
            )}
          </div>
        ))}
      </div>

      {/* Счётчик моделей */}
      <Row gap="m" align="center" style={{ marginTop: '24px' }}>
        <Text variant="body-default-s" style={{ color: '#666' }}>
          Показано {filteredModels.length} из {allModels.length} моделей
        </Text>
      </Row>
    </Column>
  );
};
