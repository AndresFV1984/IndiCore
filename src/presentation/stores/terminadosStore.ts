import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { TERMINADOS_SEED } from '../../infrastructure/seeds/catalogSeeds.js'
import {
  normalizeCatalogRecordList,
  type CatalogRecord,
  type CatalogRecordFormValues,
  buildCatalogRecordFromFormValues,
} from '../features/catalog/catalogRecord.js'

interface TerminadosStoreState {
  items: CatalogRecord[]
  hydrated: boolean
  setItems: (items: CatalogRecord[]) => void
  addItem: (item: CatalogRecord) => void
  updateItem: (item: CatalogRecord) => void
  removeItem: (id: string) => void
  createFromForm: (values: CatalogRecordFormValues) => CatalogRecord
  updateFromForm: (id: string, values: CatalogRecordFormValues) => CatalogRecord
  markHydrated: () => void
}

const seedItems = (): CatalogRecord[] => normalizeCatalogRecordList(TERMINADOS_SEED)

export const useTerminadosStore = create<TerminadosStoreState>()(
  persist(
    (set, get) => ({
      items: seedItems(),
      hydrated: false,
      setItems: items => set({ items: normalizeCatalogRecordList(items) }),
      addItem: item =>
        set(state => ({ items: normalizeCatalogRecordList([...state.items, item]) })),
      updateItem: item =>
        set(state => ({
          items: state.items.map(current => (current.id === item.id ? item : current)),
        })),
      removeItem: id => set(state => ({ items: state.items.filter(item => item.id !== id) })),
      createFromForm: values => {
        const item = buildCatalogRecordFromFormValues(values, 't')
        get().addItem(item)
        return item
      },
      updateFromForm: (id, values) => {
        const item = buildCatalogRecordFromFormValues(values, 't', id)
        get().updateItem(item)
        return item
      },
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'indicore-catalog-terminados',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ items: state.items }),
      onRehydrateStorage: () => state => {
        if (!state) return
        if (state.items.length === 0) {
          state.setItems(seedItems())
        } else {
          state.setItems(normalizeCatalogRecordList(state.items))
        }
        state.markHydrated()
      },
    }
  )
)
