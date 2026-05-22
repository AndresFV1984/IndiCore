import { create } from 'zustand';
import { Client } from '../../core/domain/entities/Client.js';

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  setError: (error: string) => void;
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  loading: false,
  error: null,
  setLoading: (loading) => set({ loading }),
  setClients: (clients) => set({ clients, loading: false, error: null }),
  addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (client) => set((state) => ({
    clients: state.clients.map(c => c.id === client.id ? client : c)
  })),
  setError: (error) => set({ error, loading: false }),
}));
