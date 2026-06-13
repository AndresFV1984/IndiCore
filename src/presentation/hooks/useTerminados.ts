import { useEffect } from 'react'
import { useTerminadosStore } from '../stores/terminadosStore.js'
import type { CatalogRecord, CatalogRecordFormValues } from '../features/catalog/catalogRecord.js'

export const useTerminadosHook = () => {
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
  } = useTerminadosStore()

  useEffect(() => {
    if (!hydrated) {
      markHydrated()
    }
  }, [hydrated, markHydrated])

  const createTerminado = (values: CatalogRecordFormValues): CatalogRecord => createFromForm(values)

  const updateTerminado = (id: string, values: CatalogRecordFormValues): CatalogRecord =>
    updateFromForm(id, values)

  const quickAccessItems = items.filter(item => item.quickAccess)

  return {
    items,
    quickAccessItems,
    loading: !hydrated,
    setItems,
    addItem,
    updateItem,
    removeItem,
    createTerminado,
    updateTerminado,
  }
}
