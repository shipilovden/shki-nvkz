"use client";

import React, { useState } from 'react';
import { Column, Row, Text, Icon, Input, Button } from '@once-ui-system/core';
import { Model3D } from '@/types/models.types';
import styles from './ModelAccordion.module.css';

interface SketchfabLoaderAccordionProps {
  onModelLoad: (model: Model3D) => void;
  onDeviceUpload?: () => void;
}

export function SketchfabLoaderAccordion({ onModelLoad, onDeviceUpload }: SketchfabLoaderAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sketchfabUrl, setSketchfabUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Извлекаем ID модели из URL Sketchfab
  const extractSketchfabId = (url: string): string | null => {
    const patterns = [
      /sketchfab\.com\/3d-models\/[^\/]*-([a-f0-9]{32})/,
      /sketchfab\.com\/models\/([a-f0-9]{32})/,
      /sketchfab\.com\/3d-models\/[^\/]*-([a-f0-9]{32})\/embed/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  };

  // Загружаем информацию о модели через Sketchfab API
  const loadSketchfabModel = async (modelId: string) => {
    try {
      setIsLoading(true);
      setError("");

      const API_TOKEN = 'ce8a7b48e37246239f4df5728b5272d0';

      const response = await fetch(`https://api.sketchfab.com/v3/models/${modelId}`, {
        headers: {
          'Authorization': `Token ${API_TOKEN}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки модели: ${response.status}`);
      }

      const data = await response.json();
      
      // Получаем прямую ссылку на GLB файл
      let glbUrl = null;
      
      try {
        const downloadResponse = await fetch(`https://api.sketchfab.com/v3/models/${modelId}/download`, {
          headers: {
            'Authorization': `Token ${API_TOKEN}`
          }
        });

        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();
          
          let glbFile = null;
          
          if (downloadData.gltf?.urls?.glb) {
            glbFile = downloadData.gltf.urls.glb;
          } else if (downloadData.gltf?.urls?.['glb-draco']) {
            glbFile = downloadData.gltf.urls['glb-draco'];
          } else if (downloadData.glb?.url) {
            glbFile = downloadData.glb.url;
          } else if (downloadData.glb?.urls?.glb) {
            glbFile = downloadData.glb.urls.glb;
          }
          
          if (glbFile) {
            glbUrl = glbFile;
          }
        }
      } catch (error) {
        console.log('Error fetching GLB:', error);
      }

      const embedUrl = `https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_controls=1&ui_infos=0&ui_inspector=0&ui_watermark=0&ui_stop=0&ui_annotations=0&ui_help=0&ui_settings=0&ui_vr=1&ui_fullscreen=1&ui_ar=1`;
      
      const supportsAR = data.viewerFeatures?.includes('ar') || false;
      const supportsVR = data.viewerFeatures?.includes('vr') || false;
      
      const model: Model3D = {
        id: `sketchfab-${modelId}`,
        title: data.name || "Sketchfab Model",
        description: data.description || "Модель из Sketchfab",
        src: glbUrl || embedUrl,
        thumbnail: data.thumbnails?.images?.[0]?.url || "/images/placeholder-3d.jpg",
        category: "Sketchfab",
        format: glbUrl ? "glb" : "sketchfab",
        author: data.user?.displayName || "Sketchfab User",
        tags: data.tags?.map((tag: any) => tag.slug) || ["sketchfab"],
        year: new Date(data.publishedAt || Date.now()).getFullYear(),
        isSketchfab: !glbUrl,
        sketchfabId: modelId,
        originalUrl: sketchfabUrl,
        arEnabled: !!glbUrl || supportsAR,
        vrEnabled: !!glbUrl || supportsVR
      };

      onModelLoad(model);
      setSketchfabUrl("");
      
    } catch (err) {
      console.error("Ошибка загрузки Sketchfab модели:", err);
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    if (!sketchfabUrl.trim()) {
      setError("Введите URL модели Sketchfab");
      return;
    }

    const modelId = extractSketchfabId(sketchfabUrl);
    if (!modelId) {
      setError("Неверный формат URL Sketchfab");
      return;
    }

    loadSketchfabModel(modelId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLoad();
    }
  };

  const handleClear = () => {
    setSketchfabUrl("");
    setError("");
  };

  return (
    <div className={styles.accordion}>
      {/* Заголовок аккордеона */}
      <div 
        className={styles.accordionHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Text variant="body-strong-xs" className={styles.accordionTitle} style={{ fontSize: '10px' }}>
          Загрузка
        </Text>
        <Icon 
          name="chevronDown" 
          size="s" 
          className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}
        />
      </div>

      {/* Содержимое аккордеона */}
      <div className={`${styles.accordionContent} ${isExpanded ? styles.accordionContentExpanded : ''}`}>
        <div style={{ padding: '8px' }}>
          <Column gap="xs">
            {/* Поле ввода URL */}
            <Input
              placeholder="Вставьте ссылку на модель Sketchfab..."
              value={sketchfabUrl}
              onChange={(e) => setSketchfabUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              style={{ 
                width: '100%',
                height: '24px',
                fontSize: '10px',
                backgroundColor: 'transparent',
                border: '1px solid var(--neutral-alpha-strong)',
                borderRadius: '4px',
                color: 'var(--color-neutral-strong)'
              }}
            />
            
            {/* Кнопки управления - только иконки */}
            <Row gap="xs" align="center" justify="center">
              <Button
                variant="secondary"
                size="xs"
                onClick={handleClear}
                disabled={isLoading || !sketchfabUrl.trim()}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  padding: '0',
                  minWidth: '20px',
                  borderRadius: '3px',
                  fontSize: '10px'
                }}
                prefixIcon="close"
              />
              
              <Button
                variant="primary"
                size="xs"
                onClick={handleLoad}
                disabled={isLoading || !sketchfabUrl.trim()}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  padding: '0',
                  minWidth: '20px',
                  borderRadius: '3px',
                  fontSize: '10px'
                }}
                prefixIcon={isLoading ? "gear" : "openLink"}
              />
              
              {onDeviceUpload && (
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={onDeviceUpload}
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    padding: '0',
                    minWidth: '20px',
                    borderRadius: '3px',
                    fontSize: '10px'
                  }}
                  prefixIcon="download"
                />
              )}
            </Row>
            
            {/* Сообщение об ошибке */}
            {error && (
              <Text 
                variant="body-default-xs" 
                style={{ 
                  color: 'var(--color-danger-medium)', 
                  textAlign: 'center',
                  padding: '8px',
                  backgroundColor: 'var(--color-danger-alpha-weak)',
                  borderRadius: '4px',
                  border: '1px solid var(--color-danger-alpha-medium)'
                }}
              >
                {error}
              </Text>
            )}
          </Column>
        </div>
      </div>
    </div>
  );
}
