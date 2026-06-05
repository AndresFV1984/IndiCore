import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ProductionNewOrderDraft } from '../features/production/utils/productionNewOrderDraft'
import { productionDraftHasContent } from '../features/production/utils/productionNewOrderDraft'

interface ProductionNewOrderDraftState {
  draft: ProductionNewOrderDraft | null
  setDraft: (draft: ProductionNewOrderDraft) => void
  clearDraft: () => void
}

export const useProductionNewOrderDraftStore = create<ProductionNewOrderDraftState>()(
  persist(
    set => ({
      draft: null,
      setDraft: draft => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'indicore-production-new-order-draft',
      storage: createJSONStorage(() => sessionStorage),
      partialize: state => ({ draft: state.draft }),
    }
  )
)

export const hasPersistedProductionNewOrderDraft = (): boolean => {
  const draft = useProductionNewOrderDraftStore.getState().draft
  return draft != null && productionDraftHasContent(draft)
}
