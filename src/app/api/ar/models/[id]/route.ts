import { NextRequest, NextResponse } from 'next/server';

// Временное хранилище моделей в памяти (в продакшене лучше использовать базу данных)
let modelsCache: Map<string, any> = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    // Ищем модель в кэше
    const model = modelsCache.get(id);
    
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (error) {
    console.error('Error fetching model:', error);
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
    
    if (!id || !modelData) {
      return NextResponse.json({ error: 'Model ID and data are required' }, { status: 400 });
    }

    // Сохраняем модель в кэш
    modelsCache.set(id, modelData);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error saving model:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
