import { notFound } from "next/navigation";
import { Column, Meta, Schema } from "@once-ui-system/core";
import { AlbumGallery } from "@/components/gallery/AlbumGallery";
import { ShareSection } from "@/components/blog/ShareSection";
import { baseURL, gallery, person } from "@/resources";
import { albums } from "@/data/gallery";

interface AlbumPageProps {
  params: Promise<{ albumId: string }>;
}

export async function generateMetadata({ params }: AlbumPageProps) {
  const { albumId } = await params;
  const album = albums.find(a => a.id === albumId);
  
  if (!album) {
    return Meta.generate({
      title: "Альбом не найден",
      description: "Запрашиваемый альбом не найден",
      baseURL: baseURL,
      path: `${gallery.path}/${albumId}`,
    });
  }

  return Meta.generate({
    title: `${album.title} - ${gallery.title}`,
    description: album.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(album.title)}`,
    path: `${gallery.path}/${albumId}`,
  });
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { albumId } = await params;
  const album = albums.find(a => a.id === albumId);

  if (!album) {
    notFound();
  }

  return (
    <Column maxWidth="l" paddingTop="24">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={`${album.title} - ${gallery.title}`}
        description={album.description}
        path={`${gallery.path}/${albumId}`}
        image={`/api/og/generate?title=${encodeURIComponent(album.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${gallery.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <AlbumGallery 
        album={album} 
        onBack={() => window.history.back()} 
      />
      <ShareSection 
        title={album.title}
        url={`${baseURL}${gallery.path}/${albumId}`}
      />
    </Column>
  );
}
