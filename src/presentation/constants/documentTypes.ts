import type { DocumentType } from '../../core/domain/entities/User'

export type { DocumentType }

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'CC', label: 'CC' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'CE' },
  { value: 'PA', label: 'PA' },
  { value: 'TI', label: 'TI' },
] as const

/** Etiqueta corta en tablas y badges */
export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  CC: 'CC',
  NIT: 'NIT',
  CE: 'CE',
  PA: 'PA',
  TI: 'TI',
}

/** Nombre completo (tooltip / accesibilidad) */
export const DOCUMENT_LABELS_FULL: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  NIT: 'Número de identificación tributaria',
  CE: 'Cédula de extranjería',
  PA: 'Pasaporte',
  TI: 'Tarjeta de identidad',
}

export function formatIdentificationNumber(
  documentType: DocumentType | string,
  raw: string,
): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return trimmed

  if (documentType === 'NIT') {
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
    }
    if (digits.length === 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    }
  }

  if (documentType === 'CC' || documentType === 'CE' || documentType === 'TI') {
    if (digits.length > 3) {
      return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }
  }

  return trimmed
}

export function resolveDocumentTypeLabel(type: DocumentType | string): string {
  return DOCUMENT_LABELS[type as DocumentType] ?? type
}
