import { create } from 'zustand'
import { Order } from '../../core/domain/entities/Order.js'
export const useOrdersStore = create<{ orders: Order[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setOrders: (o: Order[]) => void; addOrder: (o: Order) => void; updateOrder: (o: Order) => void; setError: (e: string) => void }>(set => ({
  orders: [], loading: false, error: null, setLoading: l => set({ loading: l }), setOrders: o => set({ orders: o, loading: false, error: null }),
  addOrder: o => set(s => ({ orders: [...s.orders, o] })), updateOrder: o => set(s => ({ orders: s.orders.map(x => x.id === o.id ? o : x) })), setError: e => set({ error: e, loading: false }),
}))
