import { NextRequest, NextResponse } from 'next/server';

// Временное хранилище моделей в памяти (в продакшене лучше использовать базу данных)
let modelsCache: Map<string, any> = new Map();

// Добавляем тестовую модель для проверки
if (modelsCache.size === 0) {
  modelsCache.set('test-model', {
    id: 'test-model',
    name: 'Тестовая модель',
    description: 'Тестовая 3D модель для проверки AR',
    fileUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://shki-nvkz.vercel.app/ar/view/test-model',
    arUrl: 'https://shki-nvkz.vercel.app/ar/view/test-model',
    createdAt: new Date().toISOString(),
    fileSize: 1024000,
    fileType: 'model/gltf-binary'
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('API GET: Запрос модели с ID:', id);
    console.log('API GET: Всего моделей в кэше:', modelsCache.size);
    console.log('API GET: Ключи в кэше:', Array.from(modelsCache.keys()));
    
    if (!id) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Ищем модель в кэше
    const model = modelsCache.get(id);
    console.log('API GET: Найденная модель:', model ? 'да' : 'нет');
    
    if (!model) {
      console.log('API GET: Модель не найдена, возвращаем 404');
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    console.log('API GET: Возвращаем модель:', model.name);
    return NextResponse.json(model);
  } catch (error) {
    console.error('API GET: Ошибка получения модели:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const modelData = await request.json();
    console.log('API POST: Сохранение модели с ID:', id);
    console.log('API POST: Данные модели:', modelData);
    
    if (!id || !modelData) {
      return NextResponse.json({ error: 'Model ID and data are required' }, { status: 400 });
    }

    // Сохраняем модель в кэш
    modelsCache.set(id, modelData);
    console.log('API POST: Модель сохранена. Всего моделей в кэше:', modelsCache.size);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('API POST: Ошибка сохранения модели:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Удаляем модель из кэша
    const deleted = modelsCache.delete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
