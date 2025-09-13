"use client";

import { Column, Row, Text, Button, Icon } from "@once-ui-system/core";
import type { ARCardProps } from "@/types/ar.types";

export function ARCard({ model, isSelected, onSelect, onDelete }: ARCardProps) {
  return (
    <Row
      gap="m"
      padding="m"
      style={{
        cursor: 'pointer',
        backgroundColor: isSelected 
          ? 'var(--color-brand-alpha-strong)' 
          : 'var(--color-neutral-alpha-weak)',
        border: isSelected 
          ? '2px solid var(--color-brand-strong)' 
          : '1px solid var(--color-neutral-alpha-strong)',
        borderRadius: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: '80px',
        transform: 'translateY(0)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.borderColor = 'var(--color-neutral-medium)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = 'var(--color-neutral-alpha-strong)';
        }
      }}
    >
      {/* Мини-вьювер 3D модели */}
      <div
        style={{
          width: '60px',
          height: '60px',
          backgroundColor: 'var(--color-neutral-alpha-medium)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          border: '1px solid var(--color-neutral-alpha-strong)'
        }}
      >
        {model.fileUrl ? (
          <model-viewer
            src={model.fileUrl}
            alt={model.name}
            disable-zoom
            disable-pan
            disable-tap
            interaction-policy="allow-when-focused"
            auto-rotate
            camera-orbit="0deg 75deg 1.5m"
            field-of-view="30deg"
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent'
            }}
          />
        ) : (
          <Icon name="package" size="m" onBackground="neutral-medium" />
        )}
      </div>

      {/* Информация о модели */}
      <Column flex={1} gap="xs" style={{ minWidth: 0 }}>
        <Text 
          variant="body-strong-s" 
          style={{ 
            color: isSelected ? 'var(--color-brand-strong)' : 'var(--color-neutral-strong)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {model.name}
        </Text>
        <Text 
          variant="body-default-xs" 
          onBackground="neutral-weak"
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {model.description}
        </Text>
        <Row gap="s" align="center">
          <Text variant="body-default-xs" onBackground="neutral-weak">
            {(model.fileSize / 1024 / 1024).toFixed(1)} МБ
          </Text>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            •
          </Text>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            {new Date(model.createdAt).toLocaleDateString('ru-RU')}
          </Text>
        </Row>
      </Column>

      {/* Кнопка удаления */}
      <Button
        variant="tertiary"
        size="s"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
        prefixIcon="close"
      />
    </Row>
  );
}
