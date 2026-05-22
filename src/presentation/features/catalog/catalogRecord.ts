export interface CatalogRecord {
  id: string
  name: string
  /** Mostrar en la selección rápida al asignar en producción */
  quickAccess?: boolean
  cost?: string
}

export interface CatalogRecordFormValues {
  name: string
  quickAccess: boolean
  cost: string
}

export type CatalogRecordVariant = 'terminado' | 'operacion'

/** Costo unitario sin símbolo de moneda (solo valor numérico o texto). */
export function normalizeCatalogUnitCost(value: string): string {
  return value.trim().replace(/^\$+\s*/, '')
}

export function displayCatalogUnitCost(cost?: string): string {
  const normalized = normalizeCatalogUnitCost(cost ?? '')
  return normalized || '—'
}
