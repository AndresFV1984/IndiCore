export interface ExportField<T> {
  label: string
  value: (row: T) => string
  /** Ancho sugerido de columna en Excel (caracteres). */
  width?: number
}
export function slugifyFilename(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) || 'registro' }
export function todayExportSuffix() { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}` }
