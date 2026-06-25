import { useState, useEffect } from 'react';
import { SyncStatus } from '../types';
import { syncManager } from '../services/syncManager';

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((status) => {
      setSyncStatus(status);
    });

    return () => unsubscribe();
  }, []);

  return syncStatus;
};
