# 🎯 Система управления 3D моделями

## 📋 Обзор

Эта система позволяет легко добавлять, редактировать и управлять 3D моделями в галерее. Все модели автоматически получают настройки по умолчанию и отображаются в интерфейсе.

## 🚀 Быстрый старт

### Добавление новой модели

1. **Откройте файл** `src/data/models.ts`
2. **Найдите массив** `AVAILABLE_MODELS`
3. **Добавьте новую модель** в конец массива:

```typescript
{
  id: "7", // Уникальный ID (следующий номер)
  title: "Название модели",
  description: "Описание модели",
  src: "https://ссылка-на-модель.glb",
  thumbnail: "/images/models/название-thumb.svg",
  category: "категория",
  tags: ["тег1", "тег2", "тег3"],
  size: "1.0 MB"
}
```

4. **Создайте миниатюру** в папке `public/images/models/`
5. **Перезапустите сервер** - модель появится автоматически!

## 📁 Структура файлов

```
src/
├── data/
│   └── models.ts          # Основной файл с моделями
├── components/models/
│   ├── ModelGallery.tsx   # Главная галерея
│   ├── ModelViewer.tsx    # Просмотрщик модели
│   ├── ModelSidebar.tsx   # Боковая панель
│   └── README.md          # Эта инструкция
└── types/
    └── models.types.ts    # Типы данных
```

## 🎨 Настройки по умолчанию

Все модели автоматически получают эти настройки:

```typescript
{
  format: "glb",
  author: "Google", 
  year: 2024,
  license: "Creative Commons",
  vrEnabled: true,
  arEnabled: true,
  autoRotate: true,
  cameraControls: true,
  exposure: 1.0,
  shadowIntensity: 0.5
}
```

## 📝 Поля модели

| Поле | Тип | Описание | Обязательное |
|------|-----|----------|--------------|
| `id` | string | Уникальный идентификатор | ✅ |
| `title` | string | Название модели | ✅ |
| `description` | string | Описание модели | ✅ |
| `src` | string | URL модели (.glb файл) | ✅ |
| `thumbnail` | string | Путь к миниатюре | ✅ |
| `category` | string | Категория модели | ✅ |
| `tags` | string[] | Массив тегов | ✅ |
| `size` | string | Размер файла | ✅ |

## 🏷️ Доступные категории

- `characters` - Персонажи
- `animals` - Животные  
- `technical` - Техника
- `furniture` - Мебель
- `architecture` - Архитектура
- `products` - Продукты
- `sculptures` - Скульптуры
- `games` - Игры

## 🖼️ Создание миниатюр

1. **Создайте SVG файл** в папке `public/images/models/`
2. **Назовите файл** по шаблону: `название-thumb.svg`
3. **Размер**: 200x200px или больше
4. **Формат**: SVG (рекомендуется) или PNG

### Пример миниатюры (SVG):

```svg
<svg width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f0f0f0"/>
  <text x="100" y="100" text-anchor="middle" font-size="16">
    Название модели
  </text>
</svg>
```

## 🌐 Источники моделей

### Рекомендуемые источники:

1. **Google Model Viewer** (бесплатно)
   - URL: `https://modelviewer.dev/shared-assets/models/`
   - Формат: GLB
   - Лицензия: Creative Commons
   - ✅ **Проверенные модели**: Astronaut.glb, Horse.glb, RobotExpressive.glb, NeilArmstrong.glb

2. **Sketchfab** (бесплатные модели)
   - URL: `https://sketchfab.com/3d-models/`
   - Формат: GLB/GLTF
   - Лицензия: Creative Commons
   - 🔧 **Как использовать**:
     1. Найдите модель на Sketchfab
     2. Нажмите "Download" → "GLB"
     3. Загрузите файл в `public/models/`
     4. Используйте URL: `/models/название.glb`

3. **Собственные модели**
   - Разместите в папке `public/models/`
   - URL: `/models/название.glb`

### ⚠️ Важно:
- **Всегда проверяйте** соответствие модели и названия
- **Тестируйте** загрузку модели перед добавлением
- **Используйте только рабочие ссылки**

## 🔧 Настройка модели

### Изменение настроек по умолчанию:

В файле `src/data/models.ts` найдите `DEFAULT_MODEL_SETTINGS` и измените нужные параметры:

```typescript
const DEFAULT_MODEL_SETTINGS = {
  format: "glb",
  author: "Ваше имя", // Измените автора
  year: 2024,
  license: "Creative Commons",
  vrEnabled: true,    // Включить VR
  arEnabled: true,    // Включить AR
  autoRotate: true,   // Автоповорот
  cameraControls: true, // Управление камерой
  exposure: 1.0,      // Экспозиция
  shadowIntensity: 0.5 // Интенсивность теней
};
```

### Индивидуальные настройки модели:

Если нужно изменить настройки для конкретной модели, добавьте поля в объект модели:

```typescript
{
  id: "7",
  title: "Особая модель",
  // ... другие поля
  vrEnabled: false,  // Отключить VR для этой модели
  autoRotate: false  // Отключить автоповорот
}
```

## 🐛 Решение проблем

### Модель не загружается:
1. Проверьте URL модели
2. Убедитесь, что файл доступен
3. Проверьте формат (должен быть .glb)

### Миниатюра не отображается:
1. Проверьте путь к файлу
2. Убедитесь, что файл существует
3. Проверьте права доступа

### Модель не появляется в галерее:
1. Проверьте синтаксис JSON
2. Убедитесь, что ID уникален
3. Перезапустите сервер разработки

## 📚 Дополнительные ресурсы

- [Model Viewer Documentation](https://modelviewer.dev/)
- [GLB/GLTF Format Guide](https://www.khronos.org/gltf/)
- [3D Model Optimization](https://threejs.org/docs/#manual/en/introduction/Creating-a-scene)

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте эту документацию
2. Посмотрите примеры в коде
3. Создайте issue в репозитории

---

**Удачного моделирования! 🎨✨**