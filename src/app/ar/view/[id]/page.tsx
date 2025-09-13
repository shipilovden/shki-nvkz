"use client";

import { notFound } from "next/navigation";
import { ARModelViewer } from "@/components/ar/ARModelViewer";
import { useEffect, useState } from "react";

interface ARViewPageProps {
  params: {
    id: string;
  };
}

export default function ARViewPage({ params }: ARViewPageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  const { id } = params;

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
