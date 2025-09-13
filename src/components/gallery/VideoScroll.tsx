"use client";

import { useRef, useState } from "react";
import { Column, Button, Icon } from "@once-ui-system/core";
import { VideoCard } from "./VideoCard";
import { VideoPlayer } from "./VideoPlayer";
import type { Video } from "@/types/gallery.types";

interface VideoScrollProps {
  videos: Video[];
  onVideoClick: (video: Video) => void;
}

export function VideoScroll({ videos, onVideoClick }: VideoScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -400, // ширина карточки + gap
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 400, // ширина карточки + gap
        behavior: 'smooth'
      });
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      {/* Кнопка прокрутки влево */}
      <Button
        variant="secondary"
        size="s"
        onClick={scrollLeft}
        style={{
          position: 'absolute',
          left: '-50px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          padding: '0',
          minWidth: '40px'
        }}
        prefixIcon="chevronLeft"
      />
      
      {/* Кнопка прокрутки вправо */}
      <Button
        variant="secondary"
        size="s"
        onClick={scrollRight}
        style={{
          position: 'absolute',
          right: '-50px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          padding: '0',
          minWidth: '40px'
        }}
        prefixIcon="chevronRight"
      />

      {/* Горизонтальный скролл */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '24px',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '20px 0',
          height: '100%',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          WebkitScrollbar: { display: 'none' } // Chrome/Safari
        }}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={handleVideoClick}
          />
        ))}
      </div>

      {/* Встроенный плеер */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
}
