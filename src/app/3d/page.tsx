import {
  Meta,
  Schema,
  Column,
} from "@once-ui-system/core";
import { baseURL, threeD, person } from "@/resources";
import { ModelGallery } from "@/components/models/ModelGallery";
import Script from "next/script";
import dynamic from "next/dynamic";
import { models3D } from "@/data/models";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return Meta.generate({
    title: threeD.title,
    description: threeD.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(threeD.title)}`,
    path: threeD.path,
  });
}

export default function ThreeDPage() {
  const ARQuest = dynamic(() => import("@/components/ar/ARQuest"), { ssr: false });
  return (
    <Column maxWidth="l" paddingTop="24" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=geometry`} strategy="beforeInteractive" />
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={threeD.title}
        description={threeD.description}
        path={threeD.path}
        image={`/api/og/generate?title=${encodeURIComponent(threeD.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${threeD.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      
      {/* 3D Галерея */}
      <ModelGallery 
        models={models3D}
      />

      {/* AR Quest (GPS fallback) */}
      <ARQuest />
    </Column>
  );
}