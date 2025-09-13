"use client";

import { Row, ToggleButton } from "@once-ui-system/core";
import type { GalleryMode } from "@/types/gallery.types";

interface GalleryModeToggleProps {
  mode: GalleryMode;
  onModeChange: (mode: GalleryMode) => void;
}

export function GalleryModeToggle({ mode, onModeChange }: GalleryModeToggleProps) {
  return (
    <Row gap="s" style={{ justifyContent: 'center' }}>
      <ToggleButton
        prefixIcon="image"
        onClick={() => onModeChange('photos')}
        variant={mode === 'photos' ? 'primary' : 'secondary'}
        size="m"
        style={{
          transition: 'all 0.3s ease',
          transform: mode === 'photos' ? 'scale(1.05)' : 'scale(1)',
          boxShadow: mode === 'photos' ? '0 8px 25px rgba(0, 0, 0, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}
      >
        Фото
      </ToggleButton>
      <ToggleButton
        prefixIcon="video"
        onClick={() => onModeChange('videos')}
        variant={mode === 'videos' ? 'primary' : 'secondary'}
        size="m"
        style={{
          transition: 'all 0.3s ease',
          transform: mode === 'videos' ? 'scale(1.05)' : 'scale(1)',
          boxShadow: mode === 'videos' ? '0 8px 25px rgba(0, 0, 0, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}
      >
        Видео
      </ToggleButton>
    </Row>
  );
}
