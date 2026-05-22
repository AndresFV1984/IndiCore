import { create } from 'zustand'
import { DespiecePliego } from '../../core/domain/entities/DespiecePliego.js'

export const useDespiecePliegoStore = create<{
  items: DespiecePliego[]
  loading: boolean
  error: string | null
  setLoading: (l: boolean) => void
  setItems: (i: DespiecePliego[]) => void
  addItem: (i: DespiecePliego) => void
  updateItem: (i: DespiecePliego) => void
  removeItem: (id: string) => void
  setError: (e: string | null) => void
}>(set => ({
  items: [],
  loading: false,
  error: null,
  setLoading: loading => set({ loading }),
  setItems: items => set({ items, error: null }),
  addItem: item => set(state => ({ items: [...state.items, item] })),
  updateItem: item =>
    set(state => ({
      items: state.items.map(i => (i.id === item.id ? item : i)),
    })),
  removeItem: id => set(state => ({ items: state.items.filter(i => i.id !== id) })),
  setError: error => set({ error }),
}))
