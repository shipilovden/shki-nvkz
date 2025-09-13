"use client";

import { useEffect, useRef, useState } from "react";
import { Column, Row, Text, Button, Badge, ToggleButton } from "@once-ui-system/core";
import type { Track } from "@/types/music.types";

interface MusicPlayerProps {
  track: Track | null;
  onTrackEnd?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function MusicPlayer({ track, onTrackEnd, onPrevious, onNext }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Обновляем аудио элемент при смене трека
  useEffect(() => {
    if (audioRef.current && track) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [track]);

  // Обработчики событий аудио
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onTrackEnd?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [onTrackEnd]);

  const togglePlay = () => {
    if (!audioRef.current || !track) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = Number.parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newVolume = Number.parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return (
      <Column 
        align="center" 
        gap="m" 
        padding="l" 
        background="neutral-alpha-weak" 
        style={{ borderRadius: '12px', width: '100%' }}
      >
        <Text variant="body-default-s" onBackground="neutral-medium">
          Выберите трек для воспроизведения
        </Text>
      </Column>
    );
  }

  return (
    <Column gap="l" style={{ width: '100%' }} align="center">
      {/* CSS стили для слайдеров */}
      <style jsx>{`
        .progress-slider {
          background: linear-gradient(to right, #666 0%, #666 var(--progress, 0%), #ccc var(--progress, 0%), #ccc 100%);
        }
        
        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #333;
          border: 2px solid #666;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .progress-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #333;
          border: 2px solid #666;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .progress-slider::-webkit-slider-track {
          background: #ccc;
          height: 4px;
          border-radius: 2px;
        }
        
        .progress-slider::-moz-range-track {
          background: #ccc;
          height: 4px;
          border-radius: 2px;
        }
        
        .volume-slider {
          background: linear-gradient(to right, #666 0%, #666 var(--volume, 0%), #ccc var(--volume, 0%), #ccc 100%);
        }
        
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #333;
          border: 2px solid #666;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .volume-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #333;
          border: 2px solid #666;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .volume-slider::-webkit-slider-track {
          background: #ccc;
          height: 4px;
          border-radius: 2px;
        }
        
        .volume-slider::-moz-range-track {
          background: #ccc;
          height: 4px;
          border-radius: 2px;
        }
      `}</style>
      
      {/* Скрытый аудио элемент */}
      <audio ref={audioRef} preload="metadata">
        <track kind="captions" />
      </audio>
      
      {/* Статус и название трека */}
      <Row style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="body-default-s" onBackground="neutral-medium">
          {isPlaying ? 'Now Playing...' : 'Paused...'}
        </Text>
        <Text variant="body-strong-s" onBackground="neutral-strong">
          {track.title} - {track.artist}
        </Text>
      </Row>

      {/* Прогресс бар с кнопками */}
      <Row gap="m" vertical="center" style={{ width: '100%', justifyContent: 'center' }}>
        <ToggleButton prefixIcon="repeat" />
        <ToggleButton 
          prefixIcon={isPlaying ? "pause" : "play"}
          onClick={togglePlay}
        />
        <Row gap="s" vertical="center" style={{ flex: 1, maxWidth: '300px' }}>
          <Text variant="body-default-xs" onBackground="neutral-medium">
            {formatTime(currentTime)}
          </Text>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              outline: 'none',
              cursor: 'pointer',
              WebkitAppearance: 'none',
              appearance: 'none',
              '--progress': `${duration ? (currentTime / duration) * 100 : 0}%`
            } as React.CSSProperties}
            className="progress-slider"
          />
          <Text variant="body-default-xs" onBackground="neutral-medium">
            {formatTime(duration)}
          </Text>
        </Row>
        <ToggleButton 
          prefixIcon={isMuted ? "mute" : "volume"}
          onClick={toggleMute}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          style={{
            width: '60px',
            height: '4px',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none',
            '--volume': `${(isMuted ? 0 : volume) * 100}%`
          } as React.CSSProperties}
          className="volume-slider"
        />
        <ToggleButton prefixIcon="download" />
      </Row>

      {/* Навигация по трекам */}
      <Row gap="m" vertical="center" style={{ justifyContent: 'center', width: '100%' }}>
        <ToggleButton 
          prefixIcon="previous"
          onClick={onPrevious}
          disabled={!onPrevious}
        />
        <ToggleButton 
          prefixIcon="next"
          onClick={onNext}
          disabled={!onNext}
        />
      </Row>
    </Column>
  );
}
