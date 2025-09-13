"use client";

import { useState } from "react";
import { Column, Grid, Meta, Schema, Heading } from "@once-ui-system/core";
import { GalleryModeToggle } from "@/components/gallery/GalleryModeToggle";
import { AlbumCard } from "@/components/gallery/AlbumCard";
import { AlbumGallery } from "@/components/gallery/AlbumGallery";
import { VideoScroll } from "@/components/gallery/VideoScroll";
import { ShareSection } from "@/components/blog/ShareSection";
import { baseURL, gallery, person } from "@/resources";
import { albums, videos } from "@/data/gallery";
import type { Album, Video, GalleryMode } from "@/types/gallery.types";

export default function Gallery() {
  const [mode, setMode] = useState<GalleryMode>('photos');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album);
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
  };

  const handleVideoClick = (video: Video) => {
    // Открываем видео в новом окне
    window.open(video.src, '_blank');
  };

  // Если выбран альбом, показываем галерею альбома
  if (selectedAlbum) {
    return (
      <Column maxWidth="l" paddingTop="24">
        <Schema
          as="webPage"
          baseURL={baseURL}
          title={`${selectedAlbum.title} - ${gallery.title}`}
          description={selectedAlbum.description}
          path={`${gallery.path}/${selectedAlbum.id}`}
          image={`/api/og/generate?title=${encodeURIComponent(selectedAlbum.title)}`}
          author={{
            name: person.name,
            url: `${baseURL}${gallery.path}`,
            image: `${baseURL}${person.avatar}`,
          }}
        />
        <AlbumGallery album={selectedAlbum} onBack={handleBackToAlbums} />
        <ShareSection 
          title={selectedAlbum.title}
          url={`${baseURL}${gallery.path}/${selectedAlbum.id}`}
        />
      </Column>
    );
  }

  // Показываем список альбомов
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--color-neutral-alpha-weak) 0%, var(--color-neutral-alpha-medium) 100%)',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Декоративные элементы фона */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, var(--color-brand-alpha-weak) 0%, transparent 70%)',
        borderRadius: '50%',
        opacity: 0.3,
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, var(--color-neutral-alpha-medium) 0%, transparent 70%)',
        borderRadius: '50%',
        opacity: 0.2,
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <Column maxWidth="l" paddingTop="24" style={{ position: 'relative', zIndex: 1 }}>
        <Schema
          as="webPage"
          baseURL={baseURL}
          title={gallery.title}
          description={gallery.description}
          path={gallery.path}
          image={`/api/og/generate?title=${encodeURIComponent(gallery.title)}`}
          author={{
            name: person.name,
            url: `${baseURL}${gallery.path}`,
            image: `${baseURL}${person.avatar}`,
          }}
        />
        
        {/* Заголовок в верхней части */}
        <Heading 
          marginBottom="l" 
          variant="heading-strong-xl" 
          align="center"
          style={{ 
            fontWeight: '200',
            letterSpacing: '0.1em'
          }}
        >
          Галерея
        </Heading>
        
        {/* Переключатель режимов без обводки */}
        <div style={{
          marginBottom: '32px'
        }}>
          <GalleryModeToggle mode={mode} onModeChange={setMode} />
        </div>
        
        {/* Контент в зависимости от режима */}
        {mode === 'photos' ? (
          /* Сетка альбомов с улучшенным стилем */
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(5px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--color-neutral-alpha-weak)',
            boxShadow: '0 16px 64px rgba(0, 0, 0, 0.1)'
          }}>
            <Grid
              columns="2"
              s={{ columns: 1 }}
              fillWidth
              gap="24"
              marginBottom="40"
            >
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  onClick={handleAlbumClick}
                />
              ))}
            </Grid>
          </div>
        ) : (
          /* Горизонтальный скролл видео с улучшенным стилем */
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(5px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--color-neutral-alpha-weak)',
            boxShadow: '0 16px 64px rgba(0, 0, 0, 0.1)'
          }}>
            <VideoScroll
              videos={videos}
              onVideoClick={handleVideoClick}
            />
          </div>
        )}
      </Column>

      {/* CSS анимации */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
