import axios from 'axios';
import { offlineStorage, type SyncQueueItem } from './offlineStorage';

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: number | null = null;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.autoSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Auto-sync every 5 minutes when online
    this.startAutoSync();
  }

  private startAutoSync(): void {
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.autoSync();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async autoSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    try {
      this.syncInProgress = true;
      console.log('Starting auto-sync...');

      // Sync pending sales
      await this.syncPendingSales();

      // Sync other queued items
      await this.processSyncQueue();

      // Refresh products from server
      await this.refreshProductsFromServer();

      console.log('Auto-sync completed successfully');
    } catch (error) {
      console.error('Auto-sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncPendingSales(): Promise<void> {
    const unsyncedSales = await offlineStorage.getUnsyncedSales();
    
    for (const sale of unsyncedSales) {
      try {
        await axios.post('http://localhost:5000/api/sales', {
          productId: sale.productId,
          quantity: sale.quantity,
          totalPrice: sale.totalPrice,
          customerType: sale.customerType
        });

        // Mark as synced in local storage
        await offlineStorage.markSaleAsSynced(sale.id);
        console.log(`Synced sale: ${sale.id}`);
      } catch (error) {
        console.error(`Failed to sync sale ${sale.id}:`, error);
        // Continue with other sales
      }
    }
  }

  private async processSyncQueue(): Promise<void> {
    const syncQueue = await offlineStorage.getSyncQueue();
    
    for (const item of syncQueue) {
      try {
        await this.processSyncItem(item);
        await offlineStorage.removeFromSyncQueue(item.id);
        console.log(`Processed sync queue item: ${item.id}`);
      } catch (error) {
        console.error(`Failed to process sync item ${item.id}:`, error);
        
        // Increment retry count
        await offlineStorage.incrementSyncRetries(item.id);
        
        // Remove if too many retries
        if (item.retries >= 3) {
          await offlineStorage.removeFromSyncQueue(item.id);
          console.log(`Removed sync item after max retries: ${item.id}`);
        }
      }
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'product_update':
        await axios.put(`http://localhost:5000/api/products/${item.data.id}`, item.data);
        break;
      
      case 'product_create':
        await axios.post('http://localhost:5000/api/products', item.data);
        break;
      
      case 'sale':
        // Sales are handled separately in syncPendingSales
        break;
      
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }

  private async refreshProductsFromServer(): Promise<void> {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      await offlineStorage.saveProducts(response.data);
      console.log('Refreshed products from server');
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  }

  // Manual sync trigger
  async forceSync(): Promise<{ success: boolean; message: string }> {
    if (!this.isOnline) {
      return {
        success: false,
        message: 'No internet connection. Please check your network and try again.'
      };
    }

    if (this.syncInProgress) {
      return {
        success: false,
        message: 'Sync is already in progress. Please wait...'
      };
    }

    try {
      await this.autoSync();
      
      const { products, lastSync } = await offlineStorage.getDataAge();
      const syncStatus = {
        productsAge: Math.floor(products / (1000 * 60)), // minutes
        lastSyncAge: lastSync === Infinity ? 'Never' : Math.floor(lastSync / (1000 * 60)) + ' minutes ago'
      };

      return {
        success: true,
        message: `Sync completed successfully. Products updated ${syncStatus.productsAge} minutes ago. Last sync: ${syncStatus.lastSyncAge}`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Sync failed. Please try again later.'
      };
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    syncInProgress: boolean;
    pendingSales: number;
    queuedItems: number;
    lastSync: string;
    dataAge: string;
  }> {
    const unsyncedSales = await offlineStorage.getUnsyncedSales();
    const syncQueue = await offlineStorage.getSyncQueue();
    const dataAge = await offlineStorage.getDataAge();

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingSales: unsyncedSales.length,
      queuedItems: syncQueue.length,
      lastSync: dataAge.lastSync === Infinity ? 'Never' : this.formatDuration(dataAge.lastSync),
      dataAge: this.formatDuration(dataAge.products)
    };
  }

  private formatDuration(milliseconds: number): string {
    if (milliseconds === Infinity) return 'Never';
    
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  // Initialize offline data
  async initializeOfflineData(): Promise<void> {
    try {
      // Check if we have fresh data
      const dataAge = await offlineStorage.getDataAge();
      
      // If data is older than 1 hour or doesn't exist, refresh from server
      if (dataAge.products > 60 * 60 * 1000 || dataAge.products === Infinity) {
        if (this.isOnline) {
          await this.refreshProductsFromServer();
        }
      }
    } catch (error) {
      console.error('Failed to initialize offline data:', error);
    }
  }

  // Cleanup
  destroy(): void {
    this.stopAutoSync();
  }
}

export const syncService = new SyncService();
