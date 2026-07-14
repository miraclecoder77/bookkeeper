import { SYNC_DEBOUNCE_DELAY } from '../config';
import { SyncStatus } from '../types';

type SyncCallback = () => Promise<void>;

class SyncManager {
  private syncCallbacks: Map<string, SyncCallback> = new Map();
  private syncTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private syncStatus: SyncStatus = {
    status: 'idle',
  };
  private isLocalMode = false;
  private isOnline = navigator.onLine;
  private offlineQueue: Array<{ key: string; callback: SyncCallback }> = [];
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStatus('idle', undefined, undefined);
      this.flushOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStatus('offline', undefined, undefined);
    });
  }

  public setLocalMode(enabled: boolean): void {
    this.isLocalMode = enabled;
    if (enabled) {
      this.updateStatus('local', undefined, undefined);
    } else {
      this.updateStatus(this.isOnline ? 'idle' : 'offline', undefined, undefined);
    }
  }

  public registerSync(key: string, callback: SyncCallback): void {
    this.syncCallbacks.set(key, callback);
  }

  public async debouncedSync(key: string): Promise<void> {
    if (this.isLocalMode) {
      return;
    }

    // Clear existing timer
    if (this.syncTimers.has(key)) {
      clearTimeout(this.syncTimers.get(key)!);
    }

    if (!this.isOnline) {
      // Queue for later
      const existingIndex = this.offlineQueue.findIndex((item) => item.key === key);
      if (existingIndex !== -1) {
        this.offlineQueue.splice(existingIndex, 1);
      }
      this.offlineQueue.push({
        key,
        callback: this.syncCallbacks.get(key)!,
      });
      return;
    }

    // Debounce sync
    const timer = setTimeout(async () => {
      const callback = this.syncCallbacks.get(key);
      if (callback) {
        try {
          this.updateStatus('syncing', undefined, undefined);
          await callback();
          this.updateStatus('idle', new Date(), undefined);
        } catch (error) {
          this.updateStatus('error', undefined, String(error));
          console.error(`Sync failed for ${key}:`, error);
        }
      }
      this.syncTimers.delete(key);
    }, SYNC_DEBOUNCE_DELAY);

    this.syncTimers.set(key, timer);
  }

  private async flushOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    this.updateStatus('syncing', undefined, undefined);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const { callback } of queue) {
      try {
        await callback();
      } catch (error) {
        console.error('Error flushing offline queue:', error);
        this.updateStatus('error', undefined, String(error));
        return;
      }
    }

    this.updateStatus('idle', new Date(), undefined);
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private updateStatus(status: SyncStatus['status'], lastSync?: Date, error?: string): void {
    this.syncStatus = {
      status,
      lastSync: lastSync || this.syncStatus.lastSync,
      error,
    };
    this.statusListeners.forEach((listener) => listener(this.syncStatus));
  }

  public getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public cancelAll(): void {
    this.syncTimers.forEach((timer) => clearTimeout(timer));
    this.syncTimers.clear();
    this.offlineQueue = [];
  }
}

export const syncManager = new SyncManager();
