import { create } from 'zustand'
import { TarifaMillar } from '../../core/domain/entities/TarifaMillar.js'

export const useTarifaMillarStore = create<{
  items: TarifaMillar[]
  loading: boolean
  error: string | null
  setLoading: (loading: boolean) => void
  setItems: (items: TarifaMillar[]) => void
  addItem: (item: TarifaMillar) => void
  updateItem: (item: TarifaMillar) => void
  setError: (error: string) => void
}>(set => ({
  items: [],
  loading: false,
  error: null,
  setLoading: loading => set({ loading }),
  setItems: items => set({ items, loading: false, error: null }),
  addItem: item => set(state => ({ items: [...state.items, item] })),
  updateItem: item =>
    set(state => ({
      items: state.items.map(current => (current.id === item.id ? item : current)),
    })),
  setError: error => set({ error, loading: false }),
}))
