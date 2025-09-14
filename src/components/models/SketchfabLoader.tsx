"use client";

import { useState } from "react";
import { Row, Input, Button, Text, Icon } from "@once-ui-system/core";
import type { Model3D } from "@/types/models.types";

interface SketchfabLoaderProps {
  onModelLoad: (model: Model3D) => void;
}

export function SketchfabLoader({ onModelLoad }: SketchfabLoaderProps) {
  const [sketchfabUrl, setSketchfabUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Извлекаем ID модели из URL Sketchfab
  const extractSketchfabId = (url: string): string | null => {
    // Поддерживаем разные форматы URL:
    // https://sketchfab.com/3d-models/model-name-1234567890abcdef
    // https://sketchfab.com/models/1234567890abcdef
    // https://sketchfab.com/3d-models/model-name-1234567890abcdef/embed
    
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

      // API токен Sketchfab
      const API_TOKEN = 'ce8a7b48e37246239f4df5728b5272d0';

      // Используем Sketchfab API для получения информации о модели
      const response = await fetch(`https://api.sketchfab.com/v3/models/${modelId}`, {
        headers: {
          'Authorization': `Token ${API_TOKEN}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки модели: ${response.status}`);
      }

      const data = await response.json();
      console.log('Sketchfab model data:', data);
      
      // Получаем прямую ссылку на GLB файл
      let glbUrl = null;
      
      try {
        const downloadResponse = await fetch(`https://api.sketchfab.com/v3/models/${modelId}/download`, {
          headers: {
            'Authorization': `Token ${API_TOKEN}`
          }
        });

        console.log('Download response status:', downloadResponse.status);
        
        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();
          console.log('Download data:', downloadData);
          
          // Ищем GLB файл в доступных форматах
          const glbFile = downloadData.gltf?.urls?.glb || downloadData.gltf?.urls?.['glb-draco'];
          console.log('GLB file found:', glbFile);
          
          if (glbFile) {
            glbUrl = glbFile;
            console.log('Using GLB URL:', glbUrl);
          }
        } else {
          console.log('Download failed:', downloadResponse.status, downloadResponse.statusText);
          
          // Попробуем альтернативный способ - через публичный API
          console.log('Trying alternative approach...');
          
          // Некоторые модели могут быть доступны через публичный API
          const publicResponse = await fetch(`https://api.sketchfab.com/v3/models/${modelId}`);
          if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            console.log('Public model data:', publicData);
            
            // Проверяем, есть ли публичная ссылка на GLB
            if (publicData.assets && publicData.assets.length > 0) {
              const glbAsset = publicData.assets.find((asset: any) => 
                asset.url && (asset.url.includes('.glb') || asset.url.includes('.gltf'))
              );
              if (glbAsset) {
                glbUrl = glbAsset.url;
                console.log('Found public GLB URL:', glbUrl);
              }
            }
          }
        }
      } catch (error) {
        console.log('Error fetching GLB:', error);
      }

      // Создаем объект модели для нашего вьювера
      // Попробуем использовать Sketchfab Viewer API с AR поддержкой
      const embedUrl = `https://sketchfab.com/models/${modelId}/embed?autostart=1&ui_controls=1&ui_infos=0&ui_inspector=0&ui_watermark=0&ui_stop=0&ui_annotations=0&ui_help=0&ui_settings=0&ui_vr=1&ui_fullscreen=1&ui_ar=1`;
      
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
        isSketchfab: !glbUrl, // Если есть GLB, то это не iframe
        sketchfabId: modelId,
        originalUrl: sketchfabUrl,
        arEnabled: !!glbUrl, // AR работает только с GLB
        vrEnabled: !!glbUrl  // VR работает только с GLB
      };
      
      console.log('Created model:', model);
      console.log('AR enabled:', model.arEnabled);
      console.log('VR enabled:', model.vrEnabled);
      console.log('Is Sketchfab iframe:', model.isSketchfab);

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

  return (
    <Row gap="s" align="center" style={{ width: '100%' }}>
      <Input
        placeholder="Вставьте ссылку на модель Sketchfab..."
        value={sketchfabUrl}
        onChange={(e) => setSketchfabUrl(e.target.value)}
        onKeyPress={handleKeyPress}
        style={{ flex: 1, minWidth: '200px' }}
        disabled={isLoading}
      />
      <Button
        variant="secondary"
        size="xs"
        onClick={handleLoad}
        disabled={isLoading || !sketchfabUrl.trim()}
        style={{
          fontSize: '12px',
          padding: '6px 12px',
          height: 'auto',
          minHeight: '28px',
          minWidth: '60px'
        }}
        prefixIcon={isLoading ? "gear" : "openLink"}
      >
        {isLoading ? "..." : "Загрузить"}
      </Button>
      
      {error && (
        <Text variant="body-default-xs" style={{ color: 'var(--color-danger-medium)', marginLeft: '8px' }}>
          {error}
        </Text>
      )}
    </Row>
  );
}
