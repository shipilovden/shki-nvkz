"use client";

import { Card, Column, Media, Row, Text, Icon } from "@once-ui-system/core";
import { formatDate } from "@/utils/formatDate";
import type { Album } from "@/types/gallery.types";

interface AlbumCardProps {
  album: Album;
  onClick: (album: Album) => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  return (
    <Card
      fillWidth
      key={album.id}
      onClick={() => onClick(album)}
      transition="micro-medium"
      direction="column"
      border="transparent"
      background="transparent"
      padding="4"
      radius="l-4"
      gap="16"
      style={{ 
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(5px)',
        border: '1px solid var(--color-neutral-alpha-weak)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = 'var(--color-brand-alpha-medium)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.borderColor = 'var(--color-neutral-alpha-weak)';
      }}
    >
      {/* Превью изображение */}
      <Media
        priority
        sizes="(max-width: 768px) 100vw, 640px"
        border="neutral-alpha-weak"
        cursor="interactive"
        radius="l"
        src={album.coverImage}
        alt={`Превью альбома ${album.title}`}
        aspectRatio="16 / 9"
      />
      
      {/* Информация об альбоме */}
      <Column fillWidth padding="16" gap="12">
        {/* Заголовок и избранное */}
        <Row fillWidth vertical="center" style={{ justifyContent: 'space-between' }}>
          <Text variant="heading-strong-l" wrap="balance">
            {album.title}
          </Text>
          {album.isFavorite && (
            <Icon name="star" size="s" onBackground="warning-medium" />
          )}
        </Row>
        
        {/* Описание */}
        <Text variant="body-default-s" onBackground="neutral-weak">
          {album.description}
        </Text>
        
        {/* Метаданные */}
        <Row fillWidth vertical="center" style={{ justifyContent: 'space-between' }}>
          <Row gap="16" vertical="center">
            <Text variant="label-default-s" onBackground="brand-weak">
              {album.category}
            </Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {album.photos.length} фото
            </Text>
          </Row>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            {formatDate(album.createdAt, false)}
          </Text>
        </Row>
        
        {/* Счетчик просмотров */}
        <Row vertical="center" gap="4">
          <Icon name="eye" size="xs" onBackground="neutral-medium" />
          <Text variant="body-default-xs" onBackground="neutral-medium">
            {album.views} просмотров
          </Text>
        </Row>
      </Column>
    </Card>
  );
}
