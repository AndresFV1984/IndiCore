export interface CatalogRecord {
  id: string
  name: string
  /** Mostrar en la selección rápida al asignar en producción */
  quickAccess?: boolean
  cost?: string
  /** Valor por centímetro cuadrado (sin símbolo $). */
  valorCmCuadrado?: string
  /** Reserva UV: valor al asignar en producción. */
  positivo?: string
  /** Estampado: clise al asignar en producción. */
  clise?: string
}

export interface CatalogRecordFormValues {
  name: string
  quickAccess: boolean
  cost: string
  valorCmCuadrado: string
  positivo: string
  clise: string
}

export const RESERVA_UV_TERMINADO_ID = 't5'
export const ESTAMPADO_TERMINADO_ID = 't4'

export const isReservaUvTerminado = (
  record: Pick<CatalogRecord, 'id' | 'name'>
): boolean =>
  record.id === RESERVA_UV_TERMINADO_ID ||
  record.name.trim().toLowerCase() === 'reserva uv'

export const isEstampadoTerminado = (
  record: Pick<CatalogRecord, 'id' | 'name'>
): boolean =>
  record.id === ESTAMPADO_TERMINADO_ID ||
  record.name.trim().toLowerCase() === 'estampado'

export type CatalogRecordVariant = 'terminado' | 'operacion'

export const DEFAULT_CATALOG_VALOR_CM_CUADRADO = '0000'

/** Máximo de dígitos enteros para Valor cm² (ej. 5000, 8000). */
export const CATALOG_VALOR_CM2_MAX_DIGITS = 4

export const CATALOG_VALOR_CM2_MAX = 10 ** CATALOG_VALOR_CM2_MAX_DIGITS - 1

/** Etiqueta visible para valor por centímetro cuadrado. */
export const CATALOG_VALOR_CM2_LABEL = 'Valor cm²'

export const CATALOG_VALOR_CM2_HINT =
  'Valor por cm² sin símbolo $ (hasta 4 dígitos, ej. 5000 o 8000; deje vacío para usar 0)'

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

/** Valor cm²; vacío o inválido → 0. Entero de hasta 4 dígitos al guardar. */
export function normalizeCatalogValorCmCuadrado(value: string | undefined): string {
  const normalized = normalizeCatalogUnitCost(value ?? '')
  if (!normalized) return DEFAULT_CATALOG_VALOR_CM_CUADRADO
  const numeric = parseCatalogNumeric(normalized)
  if (!Number.isFinite(numeric) || numeric < 0) return DEFAULT_CATALOG_VALOR_CM_CUADRADO
  const migrated = migrateLegacyValorCmCuadrado(numeric)
  const rounded = Math.round(migrated)
  const clamped = Math.min(CATALOG_VALOR_CM2_MAX, Math.max(0, rounded))
  return String(clamped).padStart(CATALOG_VALOR_CM2_MAX_DIGITS, '0')
}

/** Valores históricos de 1–2 dígitos (ej. 12) → escala de 4 dígitos (1200). */
const migrateLegacyValorCmCuadrado = (numeric: number): number => {
  if (numeric <= 0) return 0
  if (numeric < 100) return numeric * 100
  return numeric
}

export function formatCatalogValorCmCuadradoNumber(value: number): string {
  const clamped = Math.min(
    CATALOG_VALOR_CM2_MAX,
    Math.max(0, Math.round(migrateLegacyValorCmCuadrado(value)))
  )
  return String(clamped).padStart(CATALOG_VALOR_CM2_MAX_DIGITS, '0')
}

export function displayCatalogUnitCost(cost?: string): string {
  const normalized = normalizeCatalogUnitCost(cost ?? '')
  return normalized || '—'
}

export function displayCatalogValorCmCuadrado(value?: string): string {
  return formatCatalogValorCmCuadradoNumber(parseCatalogValorCmCuadrado(value))
}

export function buildCatalogRecordFromFormValues(
  values: CatalogRecordFormValues,
  idPrefix: 't' | 'o',
  id?: string
): CatalogRecord {
  const cost = normalizeCatalogUnitCost(values.cost)
  const record: CatalogRecord = {
    id: id ?? `${idPrefix}-${crypto.randomUUID()}`,
    name: values.name.trim(),
    quickAccess: values.quickAccess,
    cost: cost || '—',
    valorCmCuadrado: normalizeCatalogValorCmCuadrado(values.valorCmCuadrado),
  }

  if (isReservaUvTerminado(record)) {
    record.positivo = normalizeCatalogIntegerField(values.positivo)
  }

  if (isEstampadoTerminado(record)) {
    record.clise = normalizeCatalogIntegerField(values.clise)
  }

  return record
}

export function normalizeCatalogRecordList(items: readonly CatalogRecord[]): CatalogRecord[] {
  return items.map(item => {
    const normalized: CatalogRecord = {
      ...item,
      valorCmCuadrado: normalizeCatalogValorCmCuadrado(item.valorCmCuadrado),
    }
    if (isReservaUvTerminado(normalized)) {
      normalized.positivo = normalizeCatalogIntegerField(item.positivo)
      delete normalized.clise
    }
    if (isEstampadoTerminado(normalized)) {
      normalized.clise = normalizeCatalogIntegerField(item.clise)
      delete normalized.positivo
    }
    return normalized
  })
}

/** Convierte Valor cm² a número (incluye migración de valores históricos de 2 dígitos). */
export function parseCatalogValorCmCuadrado(value: string | undefined): number {
  const numeric = parseCatalogNumeric(value)
  if (!Number.isFinite(numeric) || numeric < 0) return 0
  const migrated = migrateLegacyValorCmCuadrado(numeric)
  return Math.min(CATALOG_VALOR_CM2_MAX, Math.max(0, Math.round(migrated)))
}

/** Convierte texto de catálogo (p. ej. «18.000» o «0,25») a número. */
export function parseCatalogNumeric(value: string | undefined): number {
  const raw = normalizeCatalogUnitCost(value ?? '')
  if (!raw || raw === '—') return 0
  const withoutThousands = raw.replace(/\.(?=\d{3}(?:\D|$))/g, '')
  const normalized = withoutThousands.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Entero no negativo para campos de catálogo (Positivo, Clise). */
export function parseCatalogIntegerField(value: string | undefined, fallback = 0): number {
  const parsed = Math.round(parseCatalogNumeric(value))
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

export function normalizeCatalogIntegerField(value: string | undefined): string {
  return String(parseCatalogIntegerField(value, 0))
}
