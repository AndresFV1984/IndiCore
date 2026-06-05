import React from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import CortePapelEstadoCorteFields, {
  type CortePapelEstadoCorteVariant,
} from './CortePapelEstadoCorteFields'
import CortePapelFaltanteMarca from './CortePapelFaltanteMarca'

interface CortePapelEstadoCorteShellProps {
  row: PaperRow
  onChange: (row: PaperRow) => void
  className?: string
  variant?: CortePapelEstadoCorteVariant
}

const CortePapelEstadoCorteShell: React.FC<CortePapelEstadoCorteShellProps> = ({
  row,
  onChange,
  className,
  variant = 'cliente',
}) => {
  const estado = copy.estadoCorte
  const faltante = copy.faltante
  const faltanteLitografia = variant === 'faltanteLitografia'

  return (
    <div
      className={[
        'production-diseno-modo-shell production-corte-estado-corte-shell',
        faltanteLitografia ? 'production-corte-estado-corte-shell--faltante' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={faltanteLitografia ? faltante.registroCantidadTitle : estado.ariaLabel}
    >
      <header className="production-diseno-modo-shell__head">
        {faltanteLitografia ? (
          <CortePapelFaltanteMarca className="production-corte-estado-corte-shell__marca" />
        ) : (
          <span className="production-diseno-modo-shell__tag">{estado.tag}</span>
        )}
        <div className="production-diseno-modo-shell__titles">
          <h3 className="production-diseno-modo-shell__title">
            {faltanteLitografia ? faltante.registroCantidadTitle : estado.title}
          </h3>
          <p className="production-diseno-modo-shell__sub">
            {faltanteLitografia ? faltante.registroCantidadSubtitle : estado.subtitle}
          </p>
        </div>
      </header>
      <CortePapelEstadoCorteFields embedded row={row} onChange={onChange} variant={variant} />
    </div>
  )
}

export default CortePapelEstadoCorteShell
