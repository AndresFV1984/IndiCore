import type { ExportField } from './exportFields'
import { notifySuccess } from './actionFeedback'

export interface DownloadRecordPdfOptions<T> {
  filename: string
  title: string
  subtitle?: string
  fields: ExportField<T>[]
  row: T
}

/** Carga jsPDF solo cuando el usuario exporta (evita ~400 KB en cada pantalla). */
export async function downloadRecordPdf<T>(options: DownloadRecordPdfOptions<T>): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  const { filename, title, subtitle, fields, row } = options
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.setFontSize(16)
  doc.text(title, 14, 18)
  if (subtitle) {
    doc.setFontSize(11)
    doc.text(subtitle, 14, 26)
  }

  autoTable(doc, {
    startY: subtitle ? 32 : 24,
    head: [['Campo', 'Valor']],
    body: fields.map(f => [f.label, f.value(row)]),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [30, 73, 118] },
  })

  const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  doc.save(safeName)
  notifySuccess('Exportación PDF completada.')
}
