import { useState, useCallback, useEffect } from 'react';
import { Client } from '../types';
import * as db from '../services/indexeddb';
import { syncManager } from '../services/syncManager';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await db.getAllClients();
        setClients(data);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const addClient = useCallback(
    async (client: Omit<Client, 'id'>) => {
      const newClient: Client = {
        ...client,
        id: generateId(),
      };

      try {
        await db.addClient(newClient);
        setClients((prev) => [...prev, newClient]);
        syncManager.debouncedSync('clients');
        return newClient;
      } catch (error) {
        console.error('Error adding client:', error);
        throw error;
      }
    },
    []
  );

  const updateClient = useCallback(async (client: Client) => {
    try {
      await db.updateClient(client);
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? client : c))
      );
      syncManager.debouncedSync('clients');
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    try {
      await db.deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      syncManager.debouncedSync('clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }, []);

  const getClient = useCallback(
    (id: string) => {
      return clients.find((c) => c.id === id);
    },
    [clients]
  );

  const searchClients = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return clients.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery)
      );
    },
    [clients]
  );

  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient,
    getClient,
    searchClients,
  };
};
