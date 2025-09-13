import { notFound } from "next/navigation";
import { ARModelViewer } from "@/components/ar/ARModelViewer";

interface ARViewPageProps {
  params: {
    id: string;
  };
}

export default function ARViewPage({ params }: ARViewPageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <ARModelViewer modelId={id} />
    </div>
  );
}
