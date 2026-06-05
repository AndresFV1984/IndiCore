import { Money } from '../../../../core/domain/value-objects/Money'
import type { FinishItem, OperationItem, OrderSpecs } from '../../../../core/domain/entities/Order'
import { emptyPreprensaDiseno } from '../../../../core/domain/entities/PreprensaDiseno'
import { normalizePreprensaSnapshot } from './applyPreprensaFromHistorial'
import { normalizeMargenRedondeo, DEFAULT_MARGEN_REDONDEO } from './cortePapelCalculations'
import { emptyPaperRow } from './tipoPapelDisplay'
import { syncImpresionTintasRegistros } from './impresionTintasUtils'
import type { ProductionWorkflowTabId } from '../productionTabs'
import type { SpecsSubTabId } from '../productionSpecsSubTabs'
import type { PreprensaSubTabId } from '../productionPreprensaSubTabs'
import type { CortePapelSubTabId } from '../productionCortePapelSubTabs'
import type { ImpresionSubTabId } from '../productionImpresionSubTabs'

type SerializedMoney = { value: number; currency: string }

type SerializedFinishItem = Omit<FinishItem, 'unitPrice' | 'total'> & {
  unitPrice: SerializedMoney
  total: SerializedMoney
}

type SerializedOperationItem = Omit<OperationItem, 'value'> & {
  value: SerializedMoney
}

export type SerializedOrderSpecs = Omit<
  OrderSpecs,
  'mountingValue' | 'platesValue' | 'machineOutputValue' | 'finishes' | 'operations'
> & {
  mountingValue?: SerializedMoney
  platesValue: SerializedMoney
  machineOutputValue: SerializedMoney
  finishes: SerializedFinishItem[]
  operations: SerializedOperationItem[]
}

export interface ProductionNewOrderDraft {
  clientId: string
  workName: string
  vendedorId: string
  specs: SerializedOrderSpecs
  activeTab: ProductionWorkflowTabId
  specsSubTab: SpecsSubTabId
  preprensaSubTab: PreprensaSubTabId
  cortePapelSubTab: CortePapelSubTabId
  impresionSubTab: ImpresionSubTabId
  activeCorteColorPlanchaId: string
  savedAt: string
}

/** Borradores previos guardaban Tintas bajo Corte de papel. */
export const resolveCortePapelSubTabFromDraft = (
  raw: CortePapelSubTabId | 'tintas' | undefined
): CortePapelSubTabId => (raw === 'tintas' ? 'corte' : raw ?? 'corte')

export const resolveImpresionSubTabFromDraft = (draft: {
  impresionSubTab?: ImpresionSubTabId
  cortePapelSubTab?: CortePapelSubTabId | 'tintas'
}): ImpresionSubTabId =>
  draft.impresionSubTab ??
  (draft.cortePapelSubTab === 'tintas' ? 'tintas' : 'maquina')

export const resolveActiveTabFromDraft = (draft: {
  activeTab: ProductionWorkflowTabId
  cortePapelSubTab?: CortePapelSubTabId | 'tintas'
}): ProductionWorkflowTabId =>
  draft.activeTab === 'corte-papel' && draft.cortePapelSubTab === 'tintas'
    ? 'impresion'
    : draft.activeTab

const toSerializedMoney = (money: Money): SerializedMoney => ({
  value: money.getValue(),
  currency: money.getCurrency(),
})

const fromSerializedMoney = (money: SerializedMoney): Money =>
  new Money(money.value, money.currency)

export const serializeOrderSpecsForDraft = (specs: OrderSpecs): SerializedOrderSpecs => ({
  ...specs,
  preprensaDiseno: { ...specs.preprensaDiseno },
  mountingValue: specs.mountingValue ? toSerializedMoney(specs.mountingValue) : undefined,
  platesValue: toSerializedMoney(specs.platesValue),
  machineOutputValue: toSerializedMoney(specs.machineOutputValue),
  finishes: specs.finishes.map(f => ({
    ...f,
    unitPrice: toSerializedMoney(f.unitPrice),
    total: toSerializedMoney(f.total),
  })),
  operations: specs.operations.map(op => ({
    ...op,
    value: toSerializedMoney(op.value),
  })),
})

export const hydrateOrderSpecsFromDraft = (raw: SerializedOrderSpecs): OrderSpecs => ({
  ...raw,
  margenRedondeo: normalizeMargenRedondeo(raw.margenRedondeo ?? DEFAULT_MARGEN_REDONDEO),
  clienteSuministraPapel: raw.clienteSuministraPapel ?? 'no',
  preprensaDiseno: normalizePreprensaSnapshot({
    ...emptyPreprensaDiseno(),
    ...raw.preprensaDiseno,
  }),
  paperRows: raw.paperRows?.length ? raw.paperRows : [emptyPaperRow()],
  impresionTintasRegistros: syncImpresionTintasRegistros(
    normalizePreprensaSnapshot({
      ...emptyPreprensaDiseno(),
      ...raw.preprensaDiseno,
    }).coloresPlanchas,
    raw.impresionTintasRegistros ?? []
  ),
  mountingValue: raw.mountingValue ? fromSerializedMoney(raw.mountingValue) : undefined,
  platesValue: raw.platesValue ? fromSerializedMoney(raw.platesValue) : new Money(0),
  machineOutputValue: raw.machineOutputValue
    ? fromSerializedMoney(raw.machineOutputValue)
    : new Money(0),
  finishes: raw.finishes.map(f => ({
    ...f,
    unitPrice: fromSerializedMoney(f.unitPrice),
    total: fromSerializedMoney(f.total),
  })),
  operations: raw.operations.map(op => ({
    ...op,
    value: fromSerializedMoney(op.value),
  })),
})

export const buildProductionNewOrderDraft = (input: {
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
}): ProductionNewOrderDraft => ({
  ...input,
  specs: serializeOrderSpecsForDraft(input.specs),
  savedAt: new Date().toISOString(),
})

export const productionDraftHasContent = (draft: ProductionNewOrderDraft): boolean => {
  if (draft.clientId.trim() || draft.workName.trim() || draft.vendedorId.trim()) {
    return true
  }
  const specs = draft.specs
  if (specs.quantity > 0) return true
  if ((specs.clienteSuministraPapel ?? 'no') === 'si') return true
  if ((specs.preprensaDiseno.clienteSuministraPlanchas ?? 'no') === 'si') return true
  if (specs.preprensaDiseno.coloresPlanchas.length > 0) return true
  if (specs.preprensaDiseno.nombreDiseno.trim()) return true
  if (specs.preprensaDiseno.designPdfFileName.trim()) return true
  if (specs.preprensaDiseno.disenoExistenteId.trim()) return true
  if (specs.paperRows.some(row => row.tipoPapelId?.trim() || row.despiece?.despieceId)) {
    return true
  }
  if (specs.plates > 0 || specs.platesValue.value > 0) return true
  if (specs.finishes.length > 0 || specs.operations.length > 0) return true
  return false
}
