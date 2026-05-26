/** Cantidad de hojas por unidad de empaque (valor numérico). */
export const normalizeUnidadEmpaque = (
  value: string | number | null | undefined
): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : 0
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return 0
    const matches = trimmed.match(/\d+(?:[.,]\d+)?/g)
    if (!matches?.length) return 0
    const values = matches
      .map(token => Math.round(Number(token.replace(',', '.'))))
      .filter(n => Number.isFinite(n) && n > 0)
    if (!values.length) return 0
    return Math.max(...values)
  }
  return 0
}

export const formatUnidadEmpaqueLabel = (cantidad: number): string => {
  if (cantidad <= 0) return ''
  return `${cantidad.toLocaleString('es-CO')} hojas`
}

export const formatUnidadEmpaqueDisplay = (cantidad: number): string =>
  cantidad > 0 ? cantidad.toLocaleString('es-CO') : '—'
