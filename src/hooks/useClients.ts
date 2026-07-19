import { useState, useCallback, useEffect } from 'react';
import { Client } from '../types';
import * as dal from '../services/dal';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const res = await dal.clients.list();
    if (res.ok && res.data) {
      setClients(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const addClient = useCallback(async (payload: Omit<Client, 'id'>) => {
    const res = await dal.clients.create(payload);
    if (res.ok && res.data) {
      setClients(prev => [...prev, res.data!]);
      return res.data;
    }
    return null;
  }, []);

  const updateClient = useCallback(async (id: string, patch: Partial<Client>) => {
    const res = await dal.clients.update(id, patch);
    if (res.ok && res.data) {
      setClients(prev => prev.map(c => c.id === id ? res.data! : c));
    }
    return res;
  }, []);

  const archiveClient = useCallback(async (id: string) => {
    const res = await dal.clients.archive(id);
    if (res.ok) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
    return res;
  }, []);

  return {
    clients,
    loading,
    addClient,
    updateClient,
    archiveClient,
    reloadClients: loadClients,
  };
};
