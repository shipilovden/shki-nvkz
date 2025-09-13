import {
  Meta,
  Schema,
  Column,
} from "@once-ui-system/core";
import { baseURL, ar, person } from "@/resources";
import { ARGallery } from "@/components/ar/ARGallery";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return Meta.generate({
    title: ar.title,
    description: ar.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(ar.title)}`,
    path: ar.path,
  });
}

export default function ARPage() {
  return (
    <Column maxWidth="l" paddingTop="24" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={ar.title}
        description={ar.description}
        path={ar.path}
        image={`/api/og/generate?title=${encodeURIComponent(ar.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${ar.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      
      {/* AR Галерея */}
      <ARGallery />
    </Column>
  );
}