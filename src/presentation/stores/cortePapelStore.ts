import { create } from 'zustand'
import { CortePapel } from '../../core/domain/entities/CortePapel.js'

export const useCortePapelStore = create<{
  items: CortePapel[]
  loading: boolean
  error: string | null
  setLoading: (l: boolean) => void
  setItems: (i: CortePapel[]) => void
  addItem: (i: CortePapel) => void
  updateItem: (i: CortePapel) => void
  removeItem: (id: string) => void
  setError: (e: string) => void
}>(set => ({
  items: [],
  loading: false,
  error: null,
  setLoading: l => set({ loading: l }),
  setItems: i => set({ items: i, loading: false, error: null }),
  addItem: i => set(s => ({ items: [...s.items, i] })),
  updateItem: i => set(s => ({ items: s.items.map(x => (x.id === i.id ? i : x)) })),
  removeItem: id => set(s => ({ items: s.items.filter(x => x.id !== id) })),
  setError: e => set({ error: e, loading: false }),
}))
