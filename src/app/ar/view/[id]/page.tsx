import { notFound } from "next/navigation";
import { ARModelViewer } from "@/components/ar/ARModelViewer";
import { Metadata } from "next";

interface ARViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ARViewPageProps): Promise<Metadata> {
  const { id } = await params;
  
  return {
    title: `AR Модель ${id} - Новокузнецкая школа креативных индустрий`,
    description: "Просмотр 3D модели в дополненной реальности",
    robots: "noindex, nofollow", // Не индексируем отдельные модели
  };
}

export default async function ARViewPage({ params }: ARViewPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      backgroundColor: '#f5f5f5'
    }}>
      <ARModelViewer modelId={id} />
    </div>
  );
}
