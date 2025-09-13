// Утилита для хранения AR моделей в IndexedDB
// IndexedDB может хранить гораздо больше данных чем localStorage

interface ARModelData {
  id: string;
  name: string;
  description: string;
  fileUrl: string; // base64 data URL
  qrCodeUrl: string;
  arUrl: string;
  createdAt: string;
  fileSize: number;
  fileType: string;
}

class ARStorage {
  private dbName = 'ARModelsDB';
  private dbVersion = 1;
  private storeName = 'models';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async saveModel(model: ARModelData): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put(model);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Ошибка сохранения модели в IndexedDB:', error);
      throw error;
    }
  }

  async getModel(id: string): Promise<ARModelData | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Ошибка загрузки модели из IndexedDB:', error);
      return null;
    }
  }

  async getAllModels(): Promise<ARModelData[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Ошибка загрузки всех моделей из IndexedDB:', error);
      return [];
    }
  }

  async deleteModel(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Ошибка удаления модели из IndexedDB:', error);
      throw error;
    }
  }

  async clearAllModels(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Ошибка очистки всех моделей из IndexedDB:', error);
      throw error;
    }
  }

  // Проверяем поддержку IndexedDB
  isSupported(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  // Получаем размер хранилища (приблизительно)
  async getStorageSize(): Promise<number> {
    try {
      const models = await this.getAllModels();
      return models.reduce((total, model) => total + model.fileSize, 0);
    } catch (error) {
      console.error('Ошибка получения размера хранилища:', error);
      return 0;
    }
  }
}

export const arStorage = new ARStorage();
export type { ARModelData };
