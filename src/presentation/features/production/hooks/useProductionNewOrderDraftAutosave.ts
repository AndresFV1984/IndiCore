import { useCallback, useEffect, useRef } from 'react'
import type { OrderSpecs } from '../../../../core/domain/entities/Order'
import { useProductionNewOrderDraftStore } from '../../../stores/productionNewOrderDraftStore'
import type { ProductionWorkflowTabId } from '../productionTabs'
import type { SpecsSubTabId } from '../productionSpecsSubTabs'
import type { PreprensaSubTabId } from '../productionPreprensaSubTabs'
import type { CortePapelSubTabId } from '../productionCortePapelSubTabs'
import type { ImpresionSubTabId } from '../productionImpresionSubTabs'
import {
  buildProductionNewOrderDraft,
  productionDraftHasContent,
} from '../utils/productionNewOrderDraft'

const DRAFT_AUTOSAVE_MS = 450

interface DraftAutosaveInput {
  clientId: string
  workName: string
  vendedorId: string
  specs: OrderSpecs
  activeTab: ProductionWorkflowTabId
  specsSubTab: SpecsSubTabId
  preprensaSubTab: PreprensaSubTabId
  cortePapelSubTab: CortePapelSubTabId
  impresionSubTab: ImpresionSubTabId
  activeCorteColorPlanchaId: string
}

export const useProductionNewOrderDraftAutosave = (
  enabled: boolean,
  hydrated: boolean,
  input: DraftAutosaveInput
) => {
  const setDraft = useProductionNewOrderDraftStore(state => state.setDraft)
  const clearDraft = useProductionNewOrderDraftStore(state => state.clearDraft)
  const latestInputRef = useRef(input)
  latestInputRef.current = input

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const hydratedRef = useRef(hydrated)
  hydratedRef.current = hydrated

  const persistDraftNow = useCallback(() => {
    if (!enabledRef.current || !hydratedRef.current) return

    const snapshot = buildProductionNewOrderDraft(latestInputRef.current)
    if (productionDraftHasContent(snapshot)) {
      setDraft(snapshot)
      return
    }
    clearDraft()
  }, [setDraft, clearDraft])

  useEffect(() => {
    if (!enabled || !hydrated) return

    const timer = window.setTimeout(persistDraftNow, DRAFT_AUTOSAVE_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [
    enabled,
    hydrated,
    input.clientId,
    input.workName,
    input.vendedorId,
    input.specs,
    input.activeTab,
    input.specsSubTab,
    input.preprensaSubTab,
    input.cortePapelSubTab,
    input.impresionSubTab,
    input.activeCorteColorPlanchaId,
    persistDraftNow,
  ])

  useEffect(() => {
    if (!enabled) return

    const flushOnHide = () => persistDraftNow()
    window.addEventListener('pagehide', flushOnHide)

    return () => {
      window.removeEventListener('pagehide', flushOnHide)
      persistDraftNow()
    }
  }, [enabled, persistDraftNow])
}
