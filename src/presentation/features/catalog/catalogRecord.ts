export interface CatalogRecord {
  id: string
  name: string
  /** Mostrar en la selección rápida al asignar en producción */
  quickAccess?: boolean
  cost?: string
  /** Valor por centímetro cuadrado (sin símbolo $). */
  valorCmCuadrado?: string
}

export interface CatalogRecordFormValues {
  name: string
  quickAccess: boolean
  cost: string
  valorCmCuadrado: string
}

export type CatalogRecordVariant = 'terminado' | 'operacion'

export const DEFAULT_CATALOG_VALOR_CM_CUADRADO = '0'

/** Etiqueta visible para valor por centímetro cuadrado. */
export const CATALOG_VALOR_CM2_LABEL = 'Valor cm²'

export const CATALOG_VALOR_CM2_HINT =
  'Valor por cm² sin símbolo $ (deje vacío para usar 0)'

/** Costo mínimo (terminados y operaciones de acabado). */
export const CATALOG_COSTO_MINIMO_LABEL = 'Costo mínimo'

/** @deprecated Usar {@link CATALOG_COSTO_MINIMO_LABEL}. */
export const CATALOG_TERMINADO_COSTO_LABEL = CATALOG_COSTO_MINIMO_LABEL

/** @deprecated Usar {@link CATALOG_COSTO_MINIMO_LABEL}. */
export const CATALOG_COSTO_UNITARIO_LABEL = CATALOG_COSTO_MINIMO_LABEL

/** Costo unitario sin símbolo de moneda (solo valor numérico o texto). */
export function normalizeCatalogUnitCost(value: string): string {
  return value.trim().replace(/^\$+\s*/, '')
}

/** Valor cm²; vacío o inválido → 0. */
export function normalizeCatalogValorCmCuadrado(value: string | undefined): string {
  const normalized = normalizeCatalogUnitCost(value ?? '')
  return normalized || DEFAULT_CATALOG_VALOR_CM_CUADRADO
}

export function displayCatalogUnitCost(cost?: string): string {
  const normalized = normalizeCatalogUnitCost(cost ?? '')
  return normalized || '—'
}

export function displayCatalogValorCmCuadrado(value?: string): string {
  return normalizeCatalogValorCmCuadrado(value)
}

export function buildCatalogRecordFromFormValues(
  values: CatalogRecordFormValues,
  idPrefix: 't' | 'o',
  id?: string
): CatalogRecord {
  const cost = normalizeCatalogUnitCost(values.cost)
  return {
    id: id ?? `${idPrefix}-${crypto.randomUUID()}`,
    name: values.name.trim(),
    ...(values.quickAccess ? { quickAccess: true } : {}),
    cost: cost || '—',
    valorCmCuadrado: normalizeCatalogValorCmCuadrado(values.valorCmCuadrado),
  }
}

export function normalizeCatalogRecordList(items: readonly CatalogRecord[]): CatalogRecord[] {
  return items.map(item => ({
    ...item,
    valorCmCuadrado: normalizeCatalogValorCmCuadrado(item.valorCmCuadrado),
  }))
}
