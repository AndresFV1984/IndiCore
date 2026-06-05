import React from 'react'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'

interface CortePapelFaltanteMarcaProps {
  /** Tamaño compacto para listas y selector. */
  compact?: boolean
  className?: string
}

const CortePapelFaltanteMarca: React.FC<CortePapelFaltanteMarcaProps> = ({
  compact = false,
  className,
}) => {
  const faltante = copy.faltante

  return (
    <span
      className={[
        'production-corte-faltante-marca',
        compact ? 'production-corte-faltante-marca--compact' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={faltante.registroMarcaHint}
    >
      {faltante.registroMarca}
    </span>
  )
}

export default CortePapelFaltanteMarca
