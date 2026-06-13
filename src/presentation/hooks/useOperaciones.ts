import { useEffect } from 'react'
import { useOperacionesStore } from '../stores/operacionesStore.js'
import type { CatalogRecord, CatalogRecordFormValues } from '../features/catalog/catalogRecord.js'

export const useOperacionesHook = () => {
  const {
    items,
    hydrated,
    setItems,
    addItem,
    updateItem,
    removeItem,
    createFromForm,
    updateFromForm,
    markHydrated,
  } = useOperacionesStore()

  useEffect(() => {
    if (!hydrated) {
      markHydrated()
    }
  }, [hydrated, markHydrated])

  const createOperacion = (values: CatalogRecordFormValues): CatalogRecord => createFromForm(values)

  const updateOperacion = (id: string, values: CatalogRecordFormValues): CatalogRecord =>
    updateFromForm(id, values)

  const quickAccessItems = items.filter(item => item.quickAccess === true)

  return {
    items,
    quickAccessItems,
    loading: !hydrated,
    setItems,
    addItem,
    updateItem,
    removeItem,
    createOperacion,
    updateOperacion,
  }
}
