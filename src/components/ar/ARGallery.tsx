"use client";

import { useState, useRef } from "react";
import { Column, Row, Text, Button, Input, Icon, useToast } from "@once-ui-system/core";
import { ARUploader } from "./ARUploader";
import { ARViewer } from "./ARViewer";
import { ARCard } from "./ARCard";
import type { ARModel } from "@/types/ar.types";

export function ARGallery() {
  const { addToast } = useToast();
  const [arModels, setArModels] = useState<ARModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ARModel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ngrokUrl, setNgrokUrl] = useState("");

  // Фильтруем модели по поисковому запросу
  const filteredModels = arModels.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModelUpload = (model: ARModel) => {
    setArModels(prev => [...prev, model]);
    addToast({
      variant: "success",
      message: `Модель "${model.name}" успешно загружена!`,
    });
  };

  // Проверяем, используем ли мы localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'));

  const handleModelDelete = (modelId: string) => {
    setArModels(prev => prev.filter(model => model.id !== modelId));
    if (selectedModel?.id === modelId) {
      setSelectedModel(null);
    }
    addToast({
      variant: "success",
      message: "Модель удалена",
    });
  };

  return (
    <Column gap="l" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
      {/* Заголовок */}
      <Text 
        variant="heading-strong-xl" 
        align="center"
        style={{ 
          fontWeight: '200',
          letterSpacing: '0.1em'
        }}
      >
        AR Галерея
      </Text>
      
      {/* Разделительная линия */}
      <div 
        style={{ 
          width: '100%', 
          height: '1px', 
          backgroundColor: '#ddd', 
          margin: '16px 0' 
        }} 
      />
      
      {/* Подзаголовок */}
      <Text 
        variant="heading-strong-l" 
        align="center"
        style={{ 
          fontWeight: '300',
          letterSpacing: '0.05em'
        }}
      >
        Загрузите модель и получите QR код для AR
      </Text>

      {/* Основной контент */}
      <Row 
        align="start" 
        gap="l" 
        style={{ 
          width: '100%', 
          maxWidth: '1400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Загрузчик моделей */}
        <Column 
          gap="l" 
          style={{ 
            width: '100%',
            maxWidth: '800px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Настройка для мобильных устройств */}
          {isLocalhost && (
            <Column 
              gap="m" 
              padding="l"
              style={{
                backgroundColor: 'var(--color-info-alpha-weak)',
                border: '1px solid var(--color-info-alpha-strong)',
                borderRadius: '12px',
                width: '100%'
              }}
            >
              <Row gap="m" align="center">
                <Icon name="info" size="m" onBackground="info-medium" />
                <Text variant="body-strong-m" onBackground="info-strong">
                  Для работы с телефонами
                </Text>
              </Row>
              <Text variant="body-default-s" onBackground="neutral-weak">
                Ваш сайт доступен по адресу: <strong>http://10.8.0.170:3002</strong>
              </Text>
              <Text variant="body-default-s" onBackground="neutral-weak">
                Введите этот адрес в поле ниже для генерации QR кодов:
              </Text>
              <Row gap="m" align="center">
                <Input
                  placeholder="http://10.8.0.170:3002"
                  value={ngrokUrl}
                  onChange={(e) => setNgrokUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button 
                  variant="secondary" 
                  size="s"
                  onClick={() => setNgrokUrl('http://10.8.0.170:3002')}
                  prefixIcon="globe"
                >
                  Использовать
                </Button>
              </Row>
              {ngrokUrl && (
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  QR коды будут содержать: {ngrokUrl}/ar/view/modelId
                </Text>
              )}
              <Column gap="s" style={{ marginTop: '8px' }}>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  <strong>Инструкция:</strong>
                </Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  1. Убедитесь, что телефон и компьютер в одной WiFi сети
                </Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  2. Нажмите "Использовать" для автоматической настройки
                </Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  3. Загрузите модель и получите QR код
                </Text>
                <Text variant="body-default-xs" onBackground="neutral-weak">
                  4. Откройте QR код на телефоне
                </Text>
              </Column>
            </Column>
          )}

          <ARUploader onModelUpload={handleModelUpload} ngrokUrl={ngrokUrl} />
          
          {/* AR Viewer */}
          {selectedModel && (
            <ARViewer model={selectedModel} />
          )}
        </Column>

        {/* Боковая панель с моделями */}
        {arModels.length > 0 && (
          <Column 
            gap="m" 
            style={{ 
              width: '100%',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Поиск */}
            <Input
              placeholder="Поиск моделей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />

            {/* Список моделей */}
            <Column 
              gap="s" 
              style={{ 
                width: '100%',
                maxHeight: '500px',
                overflowY: 'auto',
                padding: '12px',
                border: '1px solid var(--color-neutral-alpha-strong)',
                borderRadius: '12px',
                backgroundColor: 'var(--color-neutral-alpha-medium)'
              }}
            >
              {filteredModels.map((model) => (
                <ARCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel?.id === model.id}
                  onSelect={() => setSelectedModel(model)}
                  onDelete={() => handleModelDelete(model.id)}
                />
              ))}
            </Column>
          </Column>
        )}
      </Row>

      {/* Блок "AR Миры" */}
      <Column gap="l" align="center" style={{ width: '100%', maxWidth: '1400px', marginTop: '40px' }}>
        <Text 
          variant="heading-strong-l" 
          align="center"
          style={{ 
            fontWeight: '300',
            letterSpacing: '0.05em'
          }}
        >
          AR Миры
        </Text>
        
        <Column 
          gap="m" 
          padding="xl"
          style={{
            backgroundColor: 'var(--color-neutral-alpha-weak)',
            borderRadius: '12px',
            border: '1px solid var(--color-neutral-alpha-strong)',
            width: '100%',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          align="center"
        >
          <Text variant="body-default-m" onBackground="neutral-medium" align="center">
            Скоро здесь будут AR миры
          </Text>
          <Text variant="body-default-s" onBackground="neutral-weak" align="center">
            Интерактивные AR сцены и окружения
          </Text>
        </Column>
      </Column>
    </Column>
  );
}
