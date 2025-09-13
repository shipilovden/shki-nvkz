import type { About, Blog, Gallery, Home, Newsletter, Person, Social, Work } from "@/types";
import { Line, Logo, Row, Text } from "@once-ui-system/core";

const person: Person = {
  firstName: "шки",
  lastName: "нвкз",
  name: "шки-нвкз",
  role: "Дизайнер-разработчик",
  avatar: "/images/avatar.jpg",
  email: "example@gmail.com",
  location: "Asia/Novokuznetsk", // Expecting the IANA time zone identifier, e.g., 'Europe/Vienna'
  languages: [], // optional: Leave the array empty if you don't want to display languages
};

const newsletter: Newsletter = {
  display: false,
  title: <>Подписка на рассылку {person.firstName}</>,
  description: <>Еженедельная рассылка о творчестве и разработке</>,
};

const social: Social = [
  // Links are automatically displayed.
  // Import new icons in /once-ui/icons.ts
  {
    name: "VK",
    icon: "vk",
    link: "https://vk.com/denis_shipilov",
  },
  {
    name: "Email",
    icon: "email",
    link: `mailto:${person.email}`,
  },
];

const home: Home = {
  path: "/",
  image: "/images/og/home.jpg",
  label: "Главная",
  title: `Портфолио ${person.name}`,
  description: `Сайт-портфолио, демонстрирующий мою работу как ${person.role}`,
  headline: <>Новокузнецкая школа креативных индустрий</>,
  featured: {
    display: true,
    title: (
      <Row gap="12" vertical="center">
        <Text marginRight="4" onBackground="brand-medium">
          Карта
        </Text>
      </Row>
    ),
    href: "https://yandex.ru/maps/-/CLUzACZC",
    target: "_blank",
  },
  subline: (
    <>
      Обучение современным специальностям в Новокузнецкой школе креативных индустрий
    </>
  ),
};

const about: About = {
  path: "/about",
  label: "О школе",
  title: "О школе",
  description: `Познакомьтесь с ${person.name}, ${person.role} из ${person.location}`,
  tableOfContent: {
    display: true,
    subItems: false,
  },
  avatar: {
    display: true,
  },
  calendar: {
    display: true,
    link: "https://cal.com",
  },
  intro: {
    display: true,
    title: "Введение",
    description: (
      <>
        шки-нвкз — дизайнер-разработчик из Москвы с страстью к превращению сложных задач
        в простые и элегантные дизайн-решения. Его работа охватывает цифровые интерфейсы, интерактивные
        впечатления и сближение дизайна и технологий.
      </>
    ),
  },
  work: {
    display: true, // set to false to hide this section
    title: "Опыт работы",
    experiences: [
      {
        company: "FLY",
        timeframe: "2022 - Настоящее время",
        role: "Старший дизайнер-разработчик",
        achievements: [
          "Переработал UI/UX для платформы FLY, что привело к увеличению вовлеченности пользователей на 20% и ускорению загрузки на 30%.",
          "Возглавил интеграцию AI-инструментов в рабочие процессы дизайна, позволив дизайнерам итерироваться на 50% быстрее.",
        ],
        images: [
          // optional: leave the array empty if you don't want to display images
          {
            src: "/images/projects/project-01/cover-01.jpg",
            alt: "Проект Once UI",
            width: 16,
            height: 9,
          },
        ],
      },
      {
        company: "Creativ3",
        timeframe: "2018 - 2022",
        role: "Ведущий дизайнер",
        achievements: [
          "Разработал дизайн-систему, которая унифицировала бренд на нескольких платформах, улучшив консистентность дизайна на 40%.",
          "Руководил межфункциональной командой по запуску новой продуктовой линейки, что способствовало увеличению общей выручки компании на 15%.",
        ],
        images: [],
      },
    ],
  },
  studies: {
    display: true, // set to false to hide this section
    title: "Образование",
    institutions: [
      {
        name: "Московский государственный университет",
        description: "Изучал программную инженерию.",
      },
      {
        name: "Build the Future",
        description: "Изучал онлайн-маркетинг и личный брендинг.",
      },
    ],
  },
  technical: {
    display: true, // set to false to hide this section
    title: "Технические навыки",
    skills: [
      {
        title: "Figma",
        description: "Способен создавать прототипы в Figma с Once UI с неестественной скоростью.",
        tags: [
          {
            name: "Figma",
            icon: "figma",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          {
            src: "/images/projects/project-01/cover-02.jpg",
            alt: "Изображение проекта",
            width: 16,
            height: 9,
          },
          {
            src: "/images/projects/project-01/cover-03.jpg",
            alt: "Изображение проекта",
            width: 16,
            height: 9,
          },
        ],
      },
      {
        title: "Next.js",
        description: "Создаю приложения нового поколения с Next.js + Once UI + Supabase.",
        tags: [
          {
            name: "JavaScript",
            icon: "javascript",
          },
          {
            name: "Next.js",
            icon: "nextjs",
          },
          {
            name: "Supabase",
            icon: "supabase",
          },
        ],
        // optional: leave the array empty if you don't want to display images
        images: [
          {
            src: "/images/projects/project-01/cover-04.jpg",
            alt: "Изображение проекта",
            width: 16,
            height: 9,
          },
        ],
      },  
    ],
  },
};

const blog: Blog = {
  path: "/blog",
  label: "Студии",
  title: "Пишу о дизайне и технологиях...",
  description: `Читайте о том, чем занимался ${person.name} в последнее время`,
  // Create new blog posts by adding a new .mdx file to app/blog/posts
  // All posts will be listed on the /blog route
};

const work: Work = {
  path: "/work",
  label: "Проекты",
  title: `Проекты – ${person.name}`,
  description: `Дизайн и разработка проектов от ${person.name}`,
  // Create new project pages by adding a new .mdx file to app/blog/posts
  // All projects will be listed on the /home and /work routes
};

const gallery: Gallery = {
  path: "/gallery",
  label: "Галерея",
  title: `Фотогалерея – ${person.name}`,
  description: `Коллекция фотографий от ${person.name}`,
  // Images by https://lorant.one
  // These are placeholder images, replace with your own
  images: [
    {
      src: "/images/gallery/horizontal-1.jpg",
      alt: "изображение",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-4.jpg",
      alt: "изображение",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-3.jpg",
      alt: "изображение",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-1.jpg",
      alt: "изображение",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/vertical-2.jpg",
      alt: "изображение",
      orientation: "vertical",
    },
    {
      src: "/images/gallery/horizontal-2.jpg",
      alt: "изображение",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/horizontal-4.jpg",
      alt: "изображение",
      orientation: "horizontal",
    },
    {
      src: "/images/gallery/vertical-3.jpg",
      alt: "изображение",
      orientation: "vertical",
    },
  ],
};

const ar: Blog = {
  path: "/ar",
  label: "AR",
  title: "AR - Новокузнецкая школа креативных индустрий",
  description: "Дополненная реальность в образовании",
};

const music: Blog = {
  path: "/music",
  label: "",
  title: "Музыка - Новокузнецкая школа креативных индустрий",
  description: "Музыкальное образование и творчество",
};

const threeD: Blog = {
  path: "/3d",
  label: "3D",
  title: "3D Моделирование - Новокузнецкая школа креативных индустрий",
  description: "3D моделирование и визуализация",
};

export { person, social, newsletter, home, about, blog, work, gallery, ar, music, threeD };
