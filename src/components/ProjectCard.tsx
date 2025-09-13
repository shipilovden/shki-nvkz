"use client";

import {
  Carousel,
  Column,
  Flex,
  Heading,
} from "@once-ui-system/core";

interface ProjectCardProps {
  href: string;
  priority?: boolean;
  images: string[];
  title: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  href,
  images = [],
  title,
}) => {
  // Фильтруем только изображения (исключаем видео)
  const imageFiles = images.filter(image => 
    image.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  );


  return (
    <Column fillWidth gap="m">
      {imageFiles.length > 0 && (
        <Carousel
          sizes="(max-width: 960px) 100vw, 960px"
          items={imageFiles.map((image, index) => ({
            slide: image,
            alt: title,
            priority: true, // Приоритетная загрузка для всех изображений
          }))}
        />
      )}
      <Flex
        s={{ direction: "column" }}
        fillWidth
        paddingX="s"
        paddingTop="12"
        paddingBottom="24"
        gap="l"
      >
        {title && (
          <Flex flex={5}>
            <Heading as="h2" wrap="balance" variant="heading-strong-xl">
              {title}
            </Heading>
          </Flex>
        )}
      </Flex>
    </Column>
  );
};
