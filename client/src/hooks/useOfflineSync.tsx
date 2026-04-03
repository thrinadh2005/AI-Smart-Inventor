import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorage';
import { syncService } from '../services/syncService';

interface SyncStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  pendingSales: number;
  queuedItems: number;
  lastSync: string;
  dataAge: string;
}

interface UseOfflineSyncOptions {
  autoInitialize?: boolean;
  enableAutoSync?: boolean;
}

export const useOfflineSync = (options: UseOfflineSyncOptions = {}) => {
  const { autoInitialize = true, enableAutoSync = true } = options;
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize offline storage
  useEffect(() => {
    const initialize = async () => {
      try {
        await offlineStorage.init();
        
        if (autoInitialize) {
          await syncService.initializeOfflineData();
        }
        
        setIsInitialized(true);
        updateSyncStatus();
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
      }
    };

    initialize();
  }, [autoInitialize]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateSyncStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateSyncStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync status periodically
  useEffect(() => {
    if (!enableAutoSync || !isInitialized) return;

    const interval = setInterval(updateSyncStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [enableAutoSync, isInitialized]);

  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  }, []);

  // Manual sync
  const forceSync = useCallback(async () => {
    try {
      const result = await syncService.forceSync();
      await updateSyncStatus();
      return result;
    } catch (error) {
      console.error('Force sync failed:', error);
      return {
        success: false,
        message: 'Sync failed. Please try again.'
      };
    }
  }, [updateSyncStatus]);

  // Save sale (works offline)
  const saveSale = useCallback(async (productId: number, quantity: number, totalPrice: number, customerType: 'retail' | 'wholesale' = 'retail') => {
    try {
      const sale = await offlineStorage.saveSale({
        productId,
        quantity,
        totalPrice,
        customerType
      });

      // Update sync status
      await updateSyncStatus();

      // Try to sync immediately if online
      if (isOnline) {
        setTimeout(forceSync, 1000); // Small delay to ensure local save completes
      }

      return { success: true, sale };
    } catch (error) {
      console.error('Failed to save sale:', error);
      return { success: false, error: 'Failed to save sale' };
    }
  }, [isOnline, forceSync, updateSyncStatus]);

  // Get products (works offline)
  const getProducts = useCallback(async () => {
    try {
      return await offlineStorage.getProducts();
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }, []);

  // Save products (works offline)
  const saveProducts = useCallback(async (products: any[]) => {
    try {
      await offlineStorage.saveProducts(products);
      await updateSyncStatus();
      return { success: true };
    } catch (error) {
      console.error('Failed to save products:', error);
      return { success: false, error: 'Failed to save products' };
    }
  }, [updateSyncStatus]);

  return {
    // Status
    isOnline,
    isInitialized,
    syncStatus,
    
    // Actions
    forceSync,
    saveSale,
    getProducts,
    saveProducts,
    updateSyncStatus,
    
    // Computed states
    hasPendingSync: (syncStatus?.pendingSales || 0) > 0 || (syncStatus?.queuedItems || 0) > 0,
    isDataFresh: syncStatus ? parseInt(syncStatus.dataAge) < 60 : false, // Less than 60 minutes
    lastSyncTime: syncStatus?.lastSync || 'Unknown'
  };
};
