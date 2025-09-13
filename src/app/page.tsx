import {
  Heading,
  Text,
  Button,
  Avatar,
  RevealFx,
  Column,
  Badge,
  Row,
  Schema,
  Meta,
  Line,
} from "@once-ui-system/core";
import { home, about, person, baseURL, gallery } from "@/resources";
// import { Mailchimp } from "@/components";
import { Projects } from "@/components/work/Projects";
import { Carousel } from "@once-ui-system/core";

export async function generateMetadata() {
  return Meta.generate({
    title: home.title,
    description: home.description,
    baseURL: baseURL,
    path: home.path,
    image: home.image,
  });
}

export default function Home() {
  return (
    <Column maxWidth="m" gap="xl" paddingY="12" horizontal="center">
      <Schema
        as="webPage"
        baseURL={baseURL}
        path={home.path}
        title={home.title}
        description={home.description}
        image={`/api/og/generate?title=${encodeURIComponent(home.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${about.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Column fillWidth horizontal="center" gap="m">
        <Column maxWidth="s" horizontal="center" align="center">
          {home.featured.display && (
            <RevealFx
              fillWidth
              horizontal="center"
              paddingTop="16"
              paddingBottom="32"
              paddingLeft="12"
            >
              <Badge
                background="brand-alpha-weak"
                paddingX="12"
                paddingY="4"
                onBackground="neutral-strong"
                textVariant="label-default-s"
                arrow={false}
                href={home.featured.href}
                target={home.featured.target}
              >
                <Row paddingY="2">{home.featured.title}</Row>
              </Badge>
            </RevealFx>
          )}
          <RevealFx translateY="4" fillWidth horizontal="center" paddingBottom="16">
            <Heading wrap="balance" variant="display-strong-l">
              {home.headline}
            </Heading>
          </RevealFx>
          <RevealFx translateY="8" delay={0.2} fillWidth horizontal="center" paddingBottom="32">
            <Text wrap="balance" onBackground="neutral-weak" variant="heading-default-xl">
              {home.subline}
            </Text>
          </RevealFx>
          <RevealFx paddingTop="12" delay={0.4} horizontal="center" paddingLeft="12">
            <Button
              id="about"
              data-border="rounded"
              href={about.path}
              variant="secondary"
              size="m"
              weight="default"
              arrowIcon
            >
              <Row gap="8" vertical="center" paddingRight="4">
                {about.avatar.display && (
                  <Avatar
                    marginRight="8"
                    style={{ marginLeft: "-0.75rem" }}
                    src={person.avatar}
                    size="m"
                  />
                )}
                {about.title}
              </Row>
            </Button>
          </RevealFx>
        </Column>
      </Column>
      <RevealFx translateY="16" delay={0.6}>
        <Column fillWidth gap="m" align="center">
          <Carousel
            sizes="(max-width: 960px) 100vw, 960px"
            items={Array(4).fill({
              slide: gallery.images[0].src,
              alt: gallery.images[0].alt,
            })}
            style={{
              width: '100%',
              maxWidth: '960px',
              height: '400px',
              borderRadius: '12px'
            }}
          />
          <Heading 
            variant="heading-strong-xl" 
            align="center"
            style={{ 
              fontWeight: '200',
              letterSpacing: '0.1em'
            }}
          >
            Галерея наших работ
          </Heading>
        </Column>
      </RevealFx>
      <RevealFx translateY="16" delay={0.8}>
        <Column fillWidth gap="m" align="center">
          <Carousel
            sizes="(max-width: 960px) 100vw, 960px"
            items={Array(4).fill({
              slide: gallery.images[0].src,
              alt: gallery.images[0].alt,
            })}
            style={{
              width: '100%',
              maxWidth: '960px',
              height: '400px',
              borderRadius: '12px'
            }}
          />
          <Heading 
            variant="heading-strong-xl" 
            align="center"
            style={{ 
              fontWeight: '200',
              letterSpacing: '0.1em'
            }}
          >
            Наши проекты
          </Heading>
        </Column>
      </RevealFx>
      <RevealFx translateY="16" delay={1.0}>
        <Column fillWidth gap="m" align="center">
          <Carousel
            sizes="(max-width: 960px) 100vw, 960px"
            items={Array(4).fill({
              slide: gallery.images[0].src,
              alt: gallery.images[0].alt,
            })}
            style={{
              width: '100%',
              maxWidth: '960px',
              height: '400px',
              borderRadius: '12px'
            }}
          />
          <Heading 
            variant="heading-strong-xl" 
            align="center"
            style={{ 
              fontWeight: '200',
              letterSpacing: '0.1em'
            }}
          >
            Творческие работы
          </Heading>
        </Column>
      </RevealFx>
    </Column>
  );
}
