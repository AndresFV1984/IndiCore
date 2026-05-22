import * as XLSX from 'xlsx'
import type { ExportField } from './exportFields'
import { slugifyFilename, todayExportSuffix } from './exportFields'
import { notifyError, notifySuccess } from './actionFeedback'

export type { ExportField }
export type CsvColumn<T> = ExportField<T>
export { slugifyFilename, todayExportSuffix }

const MIN_COL_WIDTH = 10
const MAX_COL_WIDTH = 56
const COL_PADDING = 2

const displayLength = (value: string): number => {
  const text = String(value ?? '')
  let length = 0
  for (const char of text) {
    length += char.charCodeAt(0) > 255 ? 2 : 1
  }
  return length
}

const buildColumnWidths = <T>(columns: ExportField<T>[], rows: T[]): { wch: number }[] => {
  const body = rows.map(row => columns.map(col => String(col.value(row) ?? '')))

  return columns.map((col, index) => {
    const hinted = col.width
    if (hinted != null && hinted > 0) {
      return { wch: Math.min(Math.max(hinted, MIN_COL_WIDTH), MAX_COL_WIDTH) }
    }

    const values = body.map(row => row[index] ?? '')
    const maxLen = Math.max(displayLength(col.label), ...values.map(displayLength), 0)
    return { wch: Math.min(Math.max(maxLen + COL_PADDING, MIN_COL_WIDTH), MAX_COL_WIDTH) }
  })
}

const sheetRange = (rowCount: number, colCount: number): string => {
  const lastCol = XLSX.utils.encode_col(Math.max(colCount - 1, 0))
  const lastRow = Math.max(rowCount, 1)
  return `A1:${lastCol}${lastRow}`
}

/** Exporta listados como Excel (.xlsx) con columnas autoajustadas. */
export function downloadCsv<T>(filename: string, columns: ExportField<T>[], rows: T[]): void {
  if (rows.length === 0) {
    notifyError('No hay registros para exportar.')
    return
  }

  const header = columns.map(c => c.label)
  const body = rows.map(row => columns.map(c => String(c.value(row) ?? '')))
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...body])

  worksheet['!cols'] = buildColumnWidths(columns, rows)

  const rowCount = body.length + 1
  const colCount = columns.length
  worksheet['!autofilter'] = { ref: sheetRange(rowCount, colCount) }
  worksheet['!views'] = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: 1,
      topLeftCell: 'A2',
      activePane: 'bottomLeft',
    },
  ]

  const workbook = XLSX.utils.book_new()
  const sheetTitle = 'Listado'.slice(0, 31)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle)

  const baseName = filename.endsWith('.xlsx') ? filename.slice(0, -5) : filename.replace(/\.csv$/i, '')
  XLSX.writeFile(workbook, `${baseName}.xlsx`, { bookType: 'xlsx', compression: true })

  notifySuccess(
    `Exportación Excel completada (${rows.length} registro${rows.length === 1 ? '' : 's'}).`
  )
}
