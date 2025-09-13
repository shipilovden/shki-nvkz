import {
  Meta,
  Schema,
  Column,
  Row,
  Text,
  Button,
  Icon,
} from "@once-ui-system/core";
import { baseURL, ar, person } from "@/resources";
import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return Meta.generate({
    title: "AR Setup - " + ar.title,
    description: "Настройка AR для работы с телефонами",
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent("AR Setup")}`,
    path: "/ar/setup",
  });
}

export default function ARSetupPage() {
  return (
    <Column maxWidth="l" paddingTop="24" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }} align="center">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title="AR Setup"
        description="Настройка AR для работы с телефонами"
        path="/ar/setup"
        image={`/api/og/generate?title=${encodeURIComponent("AR Setup")}`}
        author={{
          name: person.name,
          url: `${baseURL}/ar/setup`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      
      <Column gap="l" style={{ width: '100%', maxWidth: '800px' }} align="center">
        {/* Заголовок */}
        <Column gap="m" align="center">
          <Icon name="rocket" size="l" onBackground="neutral-medium" style={{ fontSize: '64px' }} />
          <Text variant="heading-strong-xl" align="center">
            Настройка AR
          </Text>
          <Text variant="body-default-m" onBackground="neutral-weak" align="center">
            Для работы AR с телефонами нужен публичный URL
          </Text>
        </Column>

        {/* Проблема */}
        <Column 
          gap="m" 
          padding="l"
          style={{
            backgroundColor: 'var(--color-warning-alpha-weak)',
            border: '1px solid var(--color-warning-alpha-strong)',
            borderRadius: '12px',
            width: '100%'
          }}
        >
          <Row gap="m" align="center">
            <Icon name="warning" size="m" onBackground="warning-medium" />
            <Text variant="body-strong-m" onBackground="warning-strong">
              Проблема
            </Text>
          </Row>
          <Text variant="body-default-s" onBackground="neutral-weak">
            QR код содержит ссылку на localhost, которая не работает на телефоне. 
            Нужен публичный URL для доступа с мобильных устройств.
          </Text>
        </Column>

        {/* Решения */}
        <Column gap="l" style={{ width: '100%' }}>
          <Text variant="heading-strong-l" align="center">
            Решения
          </Text>

          {/* Решение 1: ngrok */}
          <Column 
            gap="m" 
            padding="l"
            style={{
              backgroundColor: 'var(--color-neutral-alpha-weak)',
              border: '1px solid var(--color-neutral-alpha-strong)',
              borderRadius: '12px',
              width: '100%'
            }}
          >
            <Row gap="m" align="center">
              <Icon name="rocket" size="m" onBackground="brand-medium" />
              <Text variant="body-strong-m">
                1. Использование ngrok (Рекомендуется)
              </Text>
            </Row>
            <Column gap="s">
              <Text variant="body-default-s" onBackground="neutral-weak">
                <strong>Установка:</strong>
              </Text>
              <Text variant="body-default-xs" onBackground="neutral-weak" style={{ fontFamily: 'monospace', backgroundColor: 'var(--color-neutral-alpha-medium)', padding: '8px', borderRadius: '4px' }}>
                npm install -g ngrok
              </Text>
            </Column>
            <Column gap="s">
              <Text variant="body-default-s" onBackground="neutral-weak">
                <strong>Запуск:</strong>
              </Text>
              <Text variant="body-default-xs" onBackground="neutral-weak" style={{ fontFamily: 'monospace', backgroundColor: 'var(--color-neutral-alpha-medium)', padding: '8px', borderRadius: '4px' }}>
                ngrok http 3002
              </Text>
            </Column>
            <Column gap="s">
              <Text variant="body-default-s" onBackground="neutral-weak">
                <strong>Обновление кода:</strong>
              </Text>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                Замените в файле ARUploader.tsx строку с localhost на ваш ngrok URL
              </Text>
            </Column>
          </Column>

          {/* Решение 2: Локальная сеть */}
          <Column 
            gap="m" 
            padding="l"
            style={{
              backgroundColor: 'var(--color-neutral-alpha-weak)',
              border: '1px solid var(--color-neutral-alpha-strong)',
              borderRadius: '12px',
              width: '100%'
            }}
          >
            <Row gap="m" align="center">
              <Icon name="globe" size="m" onBackground="info-medium" />
              <Text variant="body-strong-m">
                2. Локальная сеть
              </Text>
            </Row>
            <Text variant="body-default-s" onBackground="neutral-weak">
              Если телефон и компьютер в одной WiFi сети, используйте IP адрес компьютера вместо localhost
            </Text>
            <Text variant="body-default-xs" onBackground="neutral-weak" style={{ fontFamily: 'monospace', backgroundColor: 'var(--color-neutral-alpha-medium)', padding: '8px', borderRadius: '4px' }}>
              http://192.168.1.100:3002/ar/view/modelId
            </Text>
          </Column>

          {/* Решение 3: Деплой */}
          <Column 
            gap="m" 
            padding="l"
            style={{
              backgroundColor: 'var(--color-neutral-alpha-weak)',
              border: '1px solid var(--color-neutral-alpha-strong)',
              borderRadius: '12px',
              width: '100%'
            }}
          >
            <Row gap="m" align="center">
              <Icon name="globe" size="m" onBackground="success-medium" />
              <Text variant="body-strong-m">
                3. Деплой на Vercel/Netlify
              </Text>
            </Row>
            <Text variant="body-default-s" onBackground="neutral-weak">
              Загрузите проект на GitHub и подключите к Vercel или Netlify для получения постоянного публичного URL
            </Text>
          </Column>
        </Column>

        {/* Кнопки */}
        <Row gap="m" align="center" wrap>
          <Link href="/ar">
            <Button variant="primary" prefixIcon="arrowLeft">
              Назад к AR галерее
            </Button>
          </Link>
          <Button 
            variant="secondary" 
            href="https://ngrok.com/download"
            target="_blank"
            prefixIcon="openLink"
          >
            Скачать ngrok
          </Button>
        </Row>

        {/* Важно */}
        <Column 
          gap="m" 
          padding="l"
          style={{
            backgroundColor: 'var(--color-info-alpha-weak)',
            border: '1px solid var(--color-info-alpha-strong)',
            borderRadius: '12px',
            width: '100%'
          }}
        >
          <Row gap="m" align="center">
            <Icon name="info" size="m" onBackground="info-medium" />
            <Text variant="body-strong-m" onBackground="info-strong">
              Важно
            </Text>
          </Row>
          <Text variant="body-default-s" onBackground="neutral-weak">
            • HTTPS обязателен для WebXR/AR на мобильных устройствах<br/>
            • ngrok бесплатно предоставляет HTTPS<br/>
            • URL меняется при каждом перезапуске ngrok (бесплатная версия)<br/>
            • Для продакшена используйте постоянный домен
          </Text>
        </Column>
      </Column>
    </Column>
  );
}
