"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Column, 
  Row, 
  Text, 
  Input, 
  Button, 
  Grid, 
  Media, 
  Badge, 
  Icon,
  useToast
} from "@once-ui-system/core";
import type { SketchfabModel, SketchfabSearchState } from "@/types/sketchfab.types";
import styles from './ModelAccordion.module.css';

interface SketchfabAccordionProps {
  className?: string;
}

export function SketchfabAccordion({ className }: SketchfabAccordionProps) {
  const { addToast } = useToast();
  
  const [state, setState] = useState<SketchfabSearchState>({
    query: '',
    items: [],
    nextUrl: null,
    loading: false,
    error: null,
    opened: null,
  });

  const [searchInput, setSearchInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Функция для поиска моделей
  const searchModels = useCallback(async (query: string = '', cursor: string = '', append: boolean = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (cursor) params.set('cursor', cursor);
      params.set('count', '12');
      
      const response = await fetch(`/api/sketchfab/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        items: append ? [...prev.items, ...data.results] : data.results,
        nextUrl: data.next,
        loading: false,
        query: query,
      }));
      
      // Автоматически открываем секцию результатов если есть данные
      if (data.results.length > 0) {
        setIsResultsExpanded(true);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Ошибка поиска',
      }));
      
      addToast({
        variant: 'danger',
        message: `Ошибка поиска: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      });
    }
  }, [addToast]);

  // Загружаем популярные модели при первом открытии
  useEffect(() => {
    if (isExpanded && state.items.length === 0 && !state.loading) {
      searchModels();
    }
  }, [isExpanded, state.items.length, state.loading, searchModels]);

  // Обработчик поиска
  const handleSearch = () => {
    searchModels(searchInput);
  };

  // Обработчик загрузки следующей страницы
  const handleLoadMore = () => {
    if (state.nextUrl) {
      const url = new URL(state.nextUrl);
      const cursor = url.searchParams.get('cursor') || '';
      searchModels(state.query, cursor, true);
    }
  };

  // Обработчик открытия модели
  const handleModelClick = (model: SketchfabModel) => {
    setState(prev => ({ ...prev, opened: model }));
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setState(prev => ({ ...prev, opened: null }));
  };

  // Обработчик Enter в поле поиска
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={className}>
      <div className={styles.accordion}>
        {/* Заголовок аккордеона */}
        <div 
          className={styles.accordionHeader}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Text variant="body-strong-s" className={styles.accordionTitle}>
            Поиск Sketchfab
          </Text>
          <Icon 
            name="chevronDown" 
            size="s" 
            className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
          />
        </div>

        {/* Содержимое аккордеона */}
        <div className={`${styles.accordionContent} ${isExpanded ? styles.accordionContentExpanded : ''} accordion-content`}>
          <div style={{ padding: '16px' }}>
            <Column gap="l" align="start">
              {/* Поиск */}
              <Column gap="m" align="start" style={{ width: '100%' }}>
                <Row gap="s" style={{ width: '100%' }}>
                  <Input
                    placeholder="Поиск моделей на Sketchfab..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    style={{ flex: 1 }}
                  />
                  <Button 
                    variant="primary" 
                    size="s"
                    onClick={handleSearch}
                    disabled={state.loading}
                  >
                    {state.loading ? 'Поиск...' : 'Найти'}
                  </Button>
                </Row>
                
                <Text variant="body-default-xs" onBackground="neutral-weak" style={{ fontSize: '11px' }}>
                  🔍 Показываются только модели с downloadable=true и форматом glTF
                </Text>
              </Column>

              {/* Сообщение об ошибке */}
              {state.error && (
                <Row 
                  gap="xs" 
                  align="center" 
                  style={{ 
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-danger-alpha-weak)',
                    border: '1px solid var(--color-danger-alpha-strong)',
                    borderRadius: '4px',
                    width: '100%'
                  }}
                >
                  <Icon name="warning" size="xs" onBackground="danger-medium" />
                  <Text variant="body-default-xs" onBackground="danger-medium" style={{ fontSize: '11px' }}>
                    {state.error}
                  </Text>
                </Row>
              )}

              {/* Сообщение "Ничего не найдено" */}
              {!state.loading && state.items.length === 0 && state.query && (
                <Row 
                  gap="xs" 
                  align="center" 
                  style={{ 
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-neutral-alpha-weak)',
                    border: '1px solid var(--neutral-alpha-strong)',
                    borderRadius: '4px',
                    width: '100%'
                  }}
                >
                  <Icon name="search" size="xs" onBackground="neutral-medium" />
                  <Text variant="body-default-xs" onBackground="neutral-medium" style={{ fontSize: '11px' }}>
                    Ничего не найдено по запросу "{state.query}"
                  </Text>
                </Row>
              )}

              {/* Сетка моделей */}
              {state.items.length > 0 && (
                <Column gap="l" align="start" style={{ width: '100%' }}>
                  <Text variant="body-strong-s" style={{ fontSize: '14px' }}>
                    Результаты ({state.items.length})
                  </Text>
                  
                  <Grid
                    columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
                    gap="m"
                    style={{ width: '100%' }}
                  >
                    {state.items.map((model) => (
                      <div
                        key={model.uid}
                        style={{
                          cursor: 'pointer',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid var(--neutral-alpha-strong)',
                          backgroundColor: 'var(--color-neutral-alpha-weak)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onClick={() => handleModelClick(model)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Превью */}
                        <Media
                          src={model.thumbnails.images[0]?.url || '/images/placeholder-3d.jpg'}
                          alt={model.name}
                          aspectRatio="16/9"
                          style={{ width: '100%' }}
                        />
                        
                        {/* Информация о модели */}
                        <Column gap="s" padding="m">
                          <Text variant="body-strong-s" style={{ fontSize: '13px' }}>
                            {model.name}
                          </Text>
                          
                          <Text variant="body-default-xs" onBackground="neutral-medium" style={{ fontSize: '11px' }}>
                            {model.user.displayName}
                          </Text>
                          
                          <Row gap="s" align="center" style={{ justifyContent: 'space-between' }}>
                            <Row gap="xs" align="center">
                              <Icon name="heart" size="xs" onBackground="neutral-medium" />
                              <Text variant="body-default-xs" onBackground="neutral-medium" style={{ fontSize: '10px' }}>
                                {model.likeCount}
                              </Text>
                            </Row>
                            
                            <Row gap="xs">
                              <Badge variant="success" size="xs">GLTF</Badge>
                              <Badge variant="info" size="xs">Download</Badge>
                            </Row>
                          </Row>
                        </Column>
                      </div>
                    ))}
                  </Grid>

                  {/* Кнопка "Загрузить ещё" */}
                  {state.nextUrl && (
                    <Row style={{ width: '100%', justifyContent: 'center' }}>
                      <Button
                        variant="secondary"
                        size="s"
                        onClick={handleLoadMore}
                        disabled={state.loading}
                      >
                        {state.loading ? 'Загрузка...' : 'Загрузить ещё'}
                      </Button>
                    </Row>
                  )}
                </Column>
              )}
            </Column>
          </div>
        </div>
      </div>

      {/* Модальное окно с 3D вьювером */}
      {state.opened && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <Button
              variant="secondary"
              size="s"
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 1001,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
              prefixIcon="close"
            >
              Закрыть
            </Button>

            {/* Заголовок модели */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 1001,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '8px 12px',
                borderRadius: '6px'
              }}
            >
              <Text variant="body-strong-s" style={{ color: 'white', fontSize: '14px' }}>
                {state.opened.name}
              </Text>
              <Text variant="body-default-xs" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px' }}>
                {state.opened.user.displayName}
              </Text>
            </div>

            {/* Sketchfab iframe */}
            <iframe
              src={`https://sketchfab.com/models/${state.opened.uid}/embed?autostart=1&camera=0&ui_theme=dark`}
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
                borderRadius: '8px'
              }}
              allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer; vr"
              allowFullScreen
              title={state.opened.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
