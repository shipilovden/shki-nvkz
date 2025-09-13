"use client";

import { Card, Column, Media, Row, Text, Icon } from "@once-ui-system/core";
import { formatDate } from "@/utils/formatDate";
import type { Video } from "@/types/gallery.types";

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <Card
      key={video.id}
      onClick={() => onClick(video)}
      transition="micro-medium"
      direction="column"
      border="transparent"
      background="transparent"
      padding="4"
      radius="l-4"
      gap="16"
      style={{ 
        cursor: 'pointer',
        minWidth: '320px',
        maxWidth: '320px',
        position: 'relative',
        zIndex: 1,
        transition: 'transform 0.3s ease, z-index 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.zIndex = '10';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.zIndex = '1';
      }}
    >
      {/* Превью видео с кнопкой воспроизведения */}
      <div style={{ position: 'relative' }}>
        <Media
          priority
          sizes="(max-width: 768px) 100vw, 300px"
          border="neutral-alpha-weak"
          cursor="interactive"
          radius="l"
          src={video.thumbnail}
          alt={`Превью видео ${video.title}`}
          aspectRatio="16 / 9"
        />
        {/* Кнопка воспроизведения */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <Icon name="play" size="m" style={{ color: 'white', marginLeft: '4px' }} />
        </div>
        {/* Длительность видео */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          {video.duration}
        </div>
      </div>
      
      {/* Информация о видео */}
      <Column fillWidth padding="16" gap="12">
        {/* Заголовок и избранное */}
        <Row fillWidth vertical="center" style={{ justifyContent: 'space-between' }}>
          <Text variant="heading-strong-l" wrap="balance">
            {video.title}
          </Text>
          {video.isFavorite && (
            <Icon name="star" size="s" onBackground="warning-medium" />
          )}
        </Row>
        
        {/* Описание */}
        <Text variant="body-default-s" onBackground="neutral-weak">
          {video.description}
        </Text>
        
        {/* Метаданные */}
        <Row fillWidth vertical="center" style={{ justifyContent: 'space-between' }}>
          <Row gap="16" vertical="center">
            <Text variant="label-default-s" onBackground="brand-weak">
              {video.category}
            </Text>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {video.duration}
            </Text>
          </Row>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            {formatDate(video.createdAt, false)}
          </Text>
        </Row>
        
        {/* Счетчик просмотров */}
        <Row vertical="center" gap="4">
          <Icon name="eye" size="xs" onBackground="neutral-medium" />
          <Text variant="body-default-xs" onBackground="neutral-medium">
            {video.views} просмотров
          </Text>
        </Row>
      </Column>
    </Card>
  );
}
