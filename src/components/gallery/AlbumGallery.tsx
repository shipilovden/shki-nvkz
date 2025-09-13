"use client";

import { useState } from "react";
import { Column, Grid, Media, Row, Text, Button, Icon } from "@once-ui-system/core";
import type { Album, Photo } from "@/types/gallery.types";

interface AlbumGalleryProps {
  album: Album;
  onBack: () => void;
}

export function AlbumGallery({ album, onBack }: AlbumGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const handleCloseLightbox = () => {
    setSelectedPhoto(null);
  };

  const handleNextPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = album.photos.findIndex(p => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % album.photos.length;
    setSelectedPhoto(album.photos[nextIndex]);
  };

  const handlePrevPhoto = () => {
    if (!selectedPhoto) return;
    const currentIndex = album.photos.findIndex(p => p.id === selectedPhoto.id);
    const prevIndex = currentIndex === 0 ? album.photos.length - 1 : currentIndex - 1;
    setSelectedPhoto(album.photos[prevIndex]);
  };

  return (
    <Column fillWidth gap="l">
      {/* Заголовок альбома */}
      <Row fillWidth vertical="center" style={{ justifyContent: 'space-between' }}>
        <Column gap="s">
          <Row gap="s" vertical="center">
            <Button
              variant="secondary"
              size="s"
              onClick={onBack}
              prefixIcon="chevronLeft"
            >
              Назад
            </Button>
            <Text variant="heading-strong-xl">
              {album.title}
            </Text>
          </Row>
          <Text variant="body-default-s" onBackground="neutral-weak">
            {album.description} • {album.photos.length} фотографий
          </Text>
        </Column>
        <Row gap="s" vertical="center">
          <Icon name="eye" size="s" onBackground="neutral-medium" />
          <Text variant="body-default-s" onBackground="neutral-medium">
            {album.views}
          </Text>
        </Row>
      </Row>

      {/* Сетка фотографий */}
      <Grid
        columns="2"
        s={{ columns: 1 }}
        fillWidth
        gap="16"
      >
        {album.photos.map((photo) => (
          <Column
            key={photo.id}
            style={{ cursor: 'pointer' }}
            onClick={() => handlePhotoClick(photo)}
          >
            <Media
              src={photo.src}
              alt={photo.alt}
              aspectRatio="16/9"
              radius="l"
              border="neutral-alpha-weak"
              transition="micro-medium"
              style={{ 
                transition: 'transform 0.2s ease'
              }}
            />
            <Text variant="body-default-s" style={{ marginTop: '8px' }}>
              {photo.title}
            </Text>
          </Column>
        ))}
      </Grid>

      {/* Lightbox для просмотра фото */}
      {selectedPhoto && (
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
          onClick={handleCloseLightbox}
          onKeyDown={(e) => e.key === 'Escape' && handleCloseLightbox()}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <Button
              variant="secondary"
              size="s"
              onClick={handleCloseLightbox}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                zIndex: 1001
              }}
              prefixIcon="close"
            >
              Закрыть
            </Button>

            {/* Кнопка предыдущего фото */}
            <Button
              variant="secondary"
              size="s"
              onClick={handlePrevPhoto}
              style={{
                position: 'absolute',
                left: '-60px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1001
              }}
              prefixIcon="chevronLeft"
            />

            {/* Изображение */}
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.alt}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />

            {/* Кнопка следующего фото */}
            <Button
              variant="secondary"
              size="s"
              onClick={handleNextPhoto}
              style={{
                position: 'absolute',
                right: '-60px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1001
              }}
              prefixIcon="chevronRight"
            />

            {/* Информация о фото */}
            <div
              style={{
                position: 'absolute',
                bottom: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                textAlign: 'center'
              }}
            >
              <Text variant="body-default-s" style={{ color: 'white' }}>
                {selectedPhoto.title}
              </Text>
            </div>
          </div>
        </div>
      )}
    </Column>
  );
}
