"use client";

import { useState, useMemo } from "react";
import { Column, Heading, Meta, Schema, Row, Text, Input, Button, Badge } from "@once-ui-system/core";
import { baseURL, music, person } from "@/resources";
import { MusicPlayer } from "@/components/music/MusicPlayer";
import type { Track } from "@/types/music.types";
import { tracks } from "@/data/music";

export default function Music() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
    const index = tracks.findIndex(t => t.id === track.id);
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedTrack(tracks[newIndex]);
    }
  };

  const handleNext = () => {
    if (currentIndex < tracks.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedTrack(tracks[newIndex]);
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  return (
    <Column maxWidth="l" paddingTop="24" style={{ width: '100%' }} align="center">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={music.title}
        description={music.description}
        path={music.path}
        image={`/api/og/generate?title=${encodeURIComponent(music.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${music.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      
      <Heading 
        marginBottom="l" 
        variant="heading-strong-xl" 
        align="center"
        style={{ 
          fontWeight: '200',
          letterSpacing: '0.1em'
        }}
      >
        Музыка наших студентов
      </Heading>
      
      <Column style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} flex={1} gap="40">
        
        {/* Плеер */}
        <Column 
          gap="l" 
          padding="l" 
          style={{ 
            borderRadius: '12px', 
            width: '100%', 
            maxWidth: '600px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            backgroundColor: 'var(--color-neutral-alpha-medium)',
            border: '1px solid var(--color-neutral-alpha-strong)'
          }}
        >
          <MusicPlayer
            track={selectedTrack}
            onPrevious={currentIndex > 0 ? handlePrevious : undefined}
            onNext={currentIndex < tracks.length - 1 ? handleNext : undefined}
            onTrackEnd={handleTrackEnd}
          />
        </Column>
        
        {/* Поиск по центру */}
        <Column gap="m" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Input
            id="music-search"
            placeholder="Поиск по названию, исполнителю, альбому..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%' }}
          />
          {searchQuery && (
            <Button variant="secondary" size="s" onClick={() => setSearchQuery("")}>
              Очистить поиск
            </Button>
          )}
        </Column>
        
        {/* Список треков */}
        <Column gap="s" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {filteredTracks.map((track, index) => (
            <Row
              key={track.id}
              style={{ 
                width: '100%',
                cursor: 'pointer',
                padding: '8px 16px',
                backgroundColor: selectedTrack?.id === track.id ? 'var(--color-brand-alpha-weak)' : 'transparent',
                borderRadius: '4px',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onClick={() => handleTrackSelect(track)}
            >
              <Text
                variant="body-default-s"
                style={{ 
                  color: selectedTrack?.id === track.id ? 'var(--color-brand-medium)' : 'var(--color-neutral-strong)'
                }}
              >
                {String(index + 1).padStart(2, '0')}. {track.title} - {track.artist}
              </Text>
              <Text
                variant="body-default-xs"
                style={{ 
                  color: 'var(--color-neutral-medium)'
                }}
              >
                {track.duration}
              </Text>
            </Row>
          ))}
        </Column>
      </Column>
    </Column>
  );
}
