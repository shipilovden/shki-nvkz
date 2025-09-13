import { Column, Heading, Meta, Schema, Text } from "@once-ui-system/core";
import { baseURL, about, person, work } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: work.title,
    description: work.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(work.title)}`,
    path: work.path,
  });
}

export default function Work() {
  return (
    <Column maxWidth="l" paddingTop="24" style={{ width: '100%' }} align="center">
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={work.path}
        title={work.title}
        description={work.description}
        image={`/api/og/generate?title=${encodeURIComponent(work.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
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
        Проекты наших студентов
      </Heading>

      {/* Контент */}
      <Column
        fillWidth
        minHeight={400}
        vertical="center"
        horizontal="center"
        gap="m"
        paddingTop="xl"
      >
        <Text
          variant="display-default-xs"
          onBackground="neutral-weak"
          align="center"
        >
          {work.description}
        </Text>

        <Text
          variant="body-default-l"
          onBackground="neutral-medium"
          align="center"
          marginTop="l"
        >
          Страница в разработке
        </Text>
      </Column>
    </Column>
  );
}
