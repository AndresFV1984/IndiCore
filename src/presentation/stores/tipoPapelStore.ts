import { create } from 'zustand'
import { TipoPapel } from '../../core/domain/entities/TipoPapel.js'

export const useTipoPapelStore = create<{
  items: TipoPapel[]
  loading: boolean
  error: string | null
  setLoading: (l: boolean) => void
  setItems: (i: TipoPapel[]) => void
  addItem: (i: TipoPapel) => void
  updateItem: (i: TipoPapel) => void
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
  setError: error => set({ error }),
}))
