import { Column, Heading, Meta, Schema } from "@once-ui-system/core";
// import { Mailchimp } from "@/components";
import { Posts } from "@/components/blog/Posts";
import { baseURL, blog, person, newsletter } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: blog.title,
    description: blog.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(blog.title)}`,
    path: blog.path,
  });
}

export default function Blog() {
  return (
    <Column maxWidth="l" paddingTop="24" style={{ width: '100%' }} align="center">
      <Schema
        as="blogPosting"
        baseURL={baseURL}
        title={blog.title}
        description={blog.description}
        path={blog.path}
        image={`/api/og/generate?title=${encodeURIComponent(blog.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}/blog`,
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
        Студии наших студентов
      </Heading>

      <Column fillWidth flex={1} gap="40">
        <Posts range={[1, 4]} thumbnail direction="column" />
        {/* Newsletter disabled */}
      </Column>
    </Column>
  );
}
