interface OfflineSale {
  id: string;
  productId: number;
  quantity: number;
  totalPrice: number;
  customerType: 'retail' | 'wholesale';
  timestamp: number;
  synced: boolean;
}

interface OfflineProduct {
  id: number;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier?: string;
  unit: string;
  lastUpdated: number;
}

interface SyncQueueItem {
  id: string;
  type: 'sale' | 'product_update' | 'product_create';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineStorage {
  private readonly DB_NAME = 'AIInventoryDB';
  private readonly DB_VERSION = 1;
  private readonly STORES = {
    PRODUCTS: 'products',
    SALES: 'sales',
    SYNC_QUEUE: 'syncQueue'
  };

  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create products store
        if (!db.objectStoreNames.contains(this.STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(this.STORES.PRODUCTS, { keyPath: 'id' });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }

        // Create sales store
        if (!db.objectStoreNames.contains(this.STORES.SALES)) {
          const salesStore = db.createObjectStore(this.STORES.SALES, { keyPath: 'id' });
          salesStore.createIndex('productId', 'productId', { unique: false });
          salesStore.createIndex('timestamp', 'timestamp', { unique: false });
          salesStore.createIndex('synced', 'synced', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(this.STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(this.STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.init();
    }
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Products Management
  async saveProducts(products: OfflineProduct[]): Promise<void> {
    const store = await this.getStore(this.STORES.PRODUCTS, 'readwrite');
    
    const productsWithTimestamp = products.map(product => ({
      ...product,
      lastUpdated: Date.now()
    }));

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        let completed = 0;
        const total = productsWithTimestamp.length;

        if (total === 0) {
          resolve();
          return;
        }

        productsWithTimestamp.forEach(product => {
          const addRequest = store.add(product);
          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
          addRequest.onerror = () => reject(addRequest.error);
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getProducts(): Promise<OfflineProduct[]> {
    const store = await this.getStore(this.STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProduct(id: number): Promise<OfflineProduct | null> {
    const store = await this.getStore(this.STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProduct(product: OfflineProduct): Promise<void> {
    const store = await this.getStore(this.STORES.PRODUCTS, 'readwrite');
    const updatedProduct = {
      ...product,
      lastUpdated: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(updatedProduct);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sales Management
  async saveSale(sale: Omit<OfflineSale, 'id' | 'timestamp' | 'synced'>): Promise<OfflineSale> {
    const store = await this.getStore(this.STORES.SALES, 'readwrite');
    const offlineSale: OfflineSale = {
      ...sale,
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const request = store.add(offlineSale);
      request.onsuccess = () => {
        // Also add to sync queue
        this.addToSyncQueue('sale', offlineSale);
        resolve(offlineSale);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedSales(): Promise<OfflineSale[]> {
    const store = await this.getStore(this.STORES.SALES);
    const index = store.index('synced');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markSaleAsSynced(saleId: string): Promise<void> {
    const store = await this.getStore(this.STORES.SALES, 'readwrite');
    const sale = await this.getSaleById(saleId);
    
    if (sale) {
      sale.synced = true;
      return new Promise((resolve, reject) => {
        const request = store.put(sale);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  private async getSaleById(id: string): Promise<OfflineSale | null> {
    const store = await this.getStore(this.STORES.SALES);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue Management
  private async addToSyncQueue(type: 'sale' | 'product_update' | 'product_create', data: any): Promise<void> {
    const store = await this.getStore(this.STORES.SYNC_QUEUE, 'readwrite');
    const queueItem: SyncQueueItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const store = await this.getStore(this.STORES.SYNC_QUEUE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(itemId: string): Promise<void> {
    const store = await this.getStore(this.STORES.SYNC_QUEUE, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(itemId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async incrementSyncRetries(itemId: string): Promise<void> {
    const store = await this.getStore(this.STORES.SYNC_QUEUE, 'readwrite');
    const item = await this.getSyncQueueItem(itemId);
    
    if (item) {
      item.retries += 1;
      return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  private async getSyncQueueItem(id: string): Promise<SyncQueueItem | null> {
    const store = await this.getStore(this.STORES.SYNC_QUEUE);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    const stores = [this.STORES.PRODUCTS, this.STORES.SALES, this.STORES.SYNC_QUEUE];
    
    for (const storeName of stores) {
      const store = await this.getStore(storeName, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  // Data freshness check
  async getDataAge(): Promise<{ products: number; lastSync: number }> {
    const products = await this.getProducts();
    const syncQueue = await this.getSyncQueue();
    
    const productAge = products.length > 0 
      ? Date.now() - Math.max(...products.map(p => p.lastUpdated))
      : Infinity;
    
    const lastSync = syncQueue.length > 0
      ? Date.now() - Math.min(...syncQueue.map(s => s.timestamp))
      : Infinity;

    return {
      products: productAge,
      lastSync
    };
  }
}

export const offlineStorage = new OfflineStorage();
export type { OfflineSale, OfflineProduct, SyncQueueItem };
