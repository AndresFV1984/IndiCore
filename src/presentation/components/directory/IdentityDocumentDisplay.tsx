import React from 'react'
import type { DocumentType } from '../../../core/domain/entities/User'
import {
  DOCUMENT_LABELS,
  DOCUMENT_LABELS_FULL,
  formatIdentificationNumber,
} from '../../constants/documentTypes'

export type IdentityDocumentDisplayProps = {
  /** Tipo de documento (CC, NIT, etc.). En clientes suele ser NIT. */
  documentType: DocumentType | string
  number: string
  /** Apilado: tipo arriba y número abajo (celdas estrechas). */
  layout?: 'inline' | 'stacked'
}

const IdentityDocumentDisplay: React.FC<IdentityDocumentDisplayProps> = ({
  documentType,
  number,
  layout = 'inline',
}) => {
  const trimmed = number.trim()
  if (!trimmed) {
    return <span className="doc-id doc-id--empty">—</span>
  }

  const typeKey = documentType as DocumentType
  const typeLabel = DOCUMENT_LABELS[typeKey] ?? documentType
  const typeFull = DOCUMENT_LABELS_FULL[typeKey] ?? typeLabel
  const formatted = formatIdentificationNumber(documentType, trimmed)

  return (
    <div
      className={`doc-id doc-id--${layout}`}
      title={`${typeFull}: ${formatted}`}
    >
      <span className="doc-id__line" aria-label={`${typeFull}: ${formatted}`}>
        <span className="doc-id__type">{typeLabel}</span> {formatted}
      </span>
    </div>
  )
}

export default IdentityDocumentDisplay
