import {
  Meta,
  Schema,
  Column,
  Heading,
  Text,
} from "@once-ui-system/core";
import { baseURL, person } from "@/resources";
import { ARQuest } from "@/components/ar/ARQuest";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return Meta.generate({
    title: "AR Квест - Новокузнецкая школа креативных индустрий",
    description: "Интерактивный AR квест с GPS навигацией. Найдите 3D модели в реальном мире с помощью дополненной реальности.",
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent("AR Квест")}`,
    path: "/ar",
  });
}

export default function ARPage() {
  return (
    <Column maxWidth="l" paddingTop="24" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title="AR Квест"
        description="Интерактивный AR квест с GPS навигацией"
        path="/ar"
        image={`/api/og/generate?title=${encodeURIComponent("AR Квест")}`}
        author={{
          name: person.name,
          url: `${baseURL}/ar`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      
      {/* Заголовок страницы */}
      <Column gap="m" marginBottom="xl" horizontal="center">
        <Heading variant="display-strong-xl" horizontal="center">
          🚀 AR Квест
        </Heading>
        <Text variant="body-default-l" onBackground="neutral-weak" horizontal="center" style={{ maxWidth: '600px' }}>
          Интерактивный квест с дополненной реальностью. Найдите 3D модели в реальном мире с помощью GPS навигации и камеры телефона.
        </Text>
      </Column>

      {/* AR Quest компонент */}
      <ARQuest />
    </Column>
  );
}
