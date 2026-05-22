import { create } from 'zustand'
import { TamanoPlancha } from '../../core/domain/entities/TamanoPlancha.js'
export const useTamanoPlanchaStore = create<{ items: TamanoPlancha[]; loading: boolean; error: string | null; setLoading: (l: boolean) => void; setItems: (i: TamanoPlancha[]) => void; addItem: (i: TamanoPlancha) => void; updateItem: (i: TamanoPlancha) => void; setError: (e: string) => void }>(set => ({
  items: [], loading: false, error: null, setLoading: l => set({ loading: l }), setItems: i => set({ items: i, loading: false, error: null }),
  addItem: i => set(s => ({ items: [...s.items, i] })), updateItem: i => set(s => ({ items: s.items.map(x => x.id === i.id ? i : x) })), setError: e => set({ error: e, loading: false }),
}))
