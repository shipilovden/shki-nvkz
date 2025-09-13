import { notFound } from "next/navigation";
import { ARModelViewer } from "@/components/ar/ARModelViewer";

interface ARViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ARViewPage({ params }: ARViewPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <ARModelViewer modelId={id} />
    </div>
  );
}
