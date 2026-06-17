import React from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import CortePapelFaltanteMarca from './CortePapelFaltanteMarca'

interface CortePapelFaltanteLitografiaBarProps {
  row: PaperRow
  compact?: boolean
}

const CortePapelFaltanteLitografiaBar: React.FC<CortePapelFaltanteLitografiaBarProps> = ({
  row,
  compact = false,
}) => {
  const hojas = row.hojasFaltanteCantidad ?? 0
  const hojasLabel = hojas > 0 ? hojas.toLocaleString('es-CO') : '—'

  return (
    <div
      className={[
        'production-corte-faltante-litografia-bar',
        compact ? 'production-corte-faltante-litografia-bar--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      <CortePapelFaltanteMarca />
      <div className="production-corte-faltante-litografia-bar__text">
        <strong className="production-corte-faltante-litografia-bar__title">
          {copy.faltante.bannerTitle}
        </strong>
        <p className="production-corte-faltante-litografia-bar__desc">
          {copy.faltante.registroMarcaHint}
        </p>
        <p className="production-corte-faltante-litografia-bar__desc production-corte-faltante-litografia-bar__desc--hojas">
          {copy.faltante.bannerDesc(hojasLabel)}
        </p>
      </div>
    </div>
  )
}

export default CortePapelFaltanteLitografiaBar
