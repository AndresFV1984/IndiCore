import { create } from 'zustand'
import { PrecioMontaje } from '../../core/domain/entities/PrecioMontaje.js'
export const usePrecioMontajeStore = create<{ items: PrecioMontaje[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setItems: (i: PrecioMontaje[]) => void; addItem: (i: PrecioMontaje) => void; updateItem: (i: PrecioMontaje) => void; setError: (e: string) => void }>(set => ({
  items: [], loading: false, error: null, setLoading: l => set({ loading: l }), setItems: i => set({ items: i, loading: false, error: null }),
  addItem: i => set(s => ({ items: [...s.items, i] })), updateItem: i => set(s => ({ items: s.items.map(x => x.id === i.id ? i : x) })), setError: e => set({ error: e, loading: false }),
}))
