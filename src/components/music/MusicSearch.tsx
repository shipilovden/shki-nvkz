"use client";

import { useState, useMemo } from "react";
import { Column, Row, Text, Input, Button, Badge } from "@once-ui-system/core";
import type { Track } from "@/types/music.types";
import { tracks } from "@/data/music";

interface MusicSearchProps {
  onTrackSelect: (track: Track) => void;
  selectedTrack?: Track | null;
}

export function MusicSearch({ onTrackSelect, selectedTrack }: MusicSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Фильтруем треки только по поисковому запросу
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tracks;
    }

    const query = searchQuery.toLowerCase();
    return tracks.filter(track => 
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.album?.toLowerCase().includes(query) ||
      track.genre?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Column gap="l" style={{ width: '100%' }}>
      {/* Поисковая строка */}
      <Column gap="m" style={{ width: '100%' }}>
        <Text variant="heading-strong-s">Поиск музыки</Text>
        <Input
          placeholder="Поиск по названию, исполнителю, альбому..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%' }}
        />
        {searchQuery && (
          <Button variant="ghost" size="s" onClick={clearSearch}>
            Очистить поиск
          </Button>
        )}
      </Column>

      {/* Результаты поиска */}
      <Column gap="m" style={{ width: '100%' }}>
        <Row gap="s" vertical="center">
          <Text variant="body-strong-s">Найдено треков:</Text>
          <Badge variant="neutral" size="s">
            {filteredTracks.length}
          </Badge>
        </Row>

        {/* Список треков */}
        <Column gap="s" style={{ width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
          {filteredTracks.map(track => (
            <Row
              key={track.id}
              gap="m"
              vertical="center"
              padding="m"
              background={selectedTrack?.id === track.id ? "brand-alpha-weak" : "neutral-alpha-weak"}
              style={{ borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => onTrackSelect(track)}
            >
              <Column flex={1} gap="xs">
                <Text variant="body-strong-s">{track.title}</Text>
                <Text variant="body-default-s" onBackground="neutral-medium">
                  {track.artist}
                </Text>
                {track.album && (
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    {track.album}
                  </Text>
                )}
              </Column>
              
              <Column gap="xs" align="end">
                <Text variant="body-default-xs" onBackground="neutral-medium">
                  {track.duration}
                </Text>
                {track.genre && (
                  <Text variant="body-default-xs" onBackground="neutral-weak">
                    {track.genre}
                  </Text>
                )}
              </Column>
            </Row>
          ))}
        </Column>

        {filteredTracks.length === 0 && (
          <Column align="center" gap="m" padding="l">
            <Text variant="body-default-s" onBackground="neutral-medium">
              Треки не найдены
            </Text>
            <Button variant="ghost" size="s" onClick={clearSearch}>
              Очистить поиск
            </Button>
          </Column>
        )}
      </Column>
    </Column>
  );
}
