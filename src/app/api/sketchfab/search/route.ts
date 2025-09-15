import { NextRequest, NextResponse } from 'next/server';
import type { SketchfabSearchResponse, SketchfabSearchParams } from '@/types/sketchfab.types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Извлекаем параметры из URL
    const q = searchParams.get('q') || '';
    const cursor = searchParams.get('cursor') || '';
    const count = Math.min(parseInt(searchParams.get('count') || '12'), 24); // Максимум 24
    
    // Базовые параметры для Sketchfab API
    const sketchfabParams = new URLSearchParams({
      type: 'models',
      downloadable: 'true',
      formats: 'glTF',
      sort_by: '-likeCount', // Популярные по умолчанию
      count: count.toString(),
      // Фильтрация AR моделей происходит на клиентской стороне
    });
    
    // Добавляем поисковый запрос если есть
    if (q.trim()) {
      sketchfabParams.set('q', q.trim());
    }
    
    // Добавляем курсор для пагинации если есть
    if (cursor) {
      sketchfabParams.set('cursor', cursor);
    }
    
    // Формируем URL для запроса к Sketchfab API
    const sketchfabUrl = `https://api.sketchfab.com/v3/search?${sketchfabParams.toString()}`;
    
    // Подготавливаем заголовки
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Добавляем токен если есть в переменных окружения
    const sketchfabToken = process.env.SKETCHFAB_TOKEN;
    if (sketchfabToken) {
      headers['Authorization'] = `Token ${sketchfabToken}`;
    }
    
    // Делаем запрос к Sketchfab API
    const response = await fetch(sketchfabUrl, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      // Обрабатываем различные ошибки
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Unauthorized. Check your Sketchfab token.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Sketchfab API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data: SketchfabSearchResponse = await response.json();
    
    // Возвращаем данные как есть
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Sketchfab search error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
