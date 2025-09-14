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

      // Используем Sketchfab API для получения информации о модели
      const response = await fetch(`https://api.sketchfab.com/v3/models/${modelId}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки модели: ${response.status}`);
      }

      const data = await response.json();
      
      // Создаем объект модели для нашего вьювера
      // Используем Sketchfab Viewer API для загрузки в model-viewer
      const model: Model3D = {
        id: `sketchfab-${modelId}`,
        title: data.name || "Sketchfab Model",
        description: data.description || "Модель из Sketchfab",
        src: `https://api.sketchfab.com/v3/models/${modelId}/download`, // Прямая ссылка на GLB
        thumbnail: data.thumbnails?.images?.[0]?.url || "/images/placeholder-3d.jpg",
        category: "Sketchfab",
        format: "glb",
        author: data.user?.displayName || "Sketchfab User",
        tags: data.tags?.map((tag: any) => tag.slug) || ["sketchfab"],
        year: new Date(data.publishedAt || Date.now()).getFullYear(),
        isSketchfab: true,
        sketchfabId: modelId,
        originalUrl: sketchfabUrl,
        arEnabled: true, // Включаем AR для Sketchfab моделей
        vrEnabled: true  // Включаем VR для Sketchfab моделей
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
