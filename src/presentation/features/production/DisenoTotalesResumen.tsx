import React, { useMemo } from 'react'
import { PreprensaDisenoSpecs } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { computeDisenoResumenTotales } from './utils/preprensaDisenoTotales'

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

interface DisenoTotalesResumenProps {
  diseno: PreprensaDisenoSpecs
}

const DisenoTotalesResumen: React.FC<DisenoTotalesResumenProps> = ({ diseno }) => {
  const resumen = useMemo(() => computeDisenoResumenTotales(diseno), [diseno])

  const filas = [
    {
      label: 'Costo del diseño',
      value: resumen.costoDiseno,
      inactive: !diseno.aplicaCostoDiseno,
    },
    {
      label: 'Valor Total Planchas',
      value: resumen.valorTotalPlanchas,
      inactive: resumen.valorTotalPlanchas <= 0,
    },
    {
      label: 'Precio de montaje',
      value: resumen.precioMontaje,
      inactive: !diseno.precioMontajeId,
    },
  ]

  return (
    <ProductionWorkspaceSection
      className="production-diseno-resumen production-diseno-nuevo-panel production-diseno-nuevo-panel--resumen"
      title="Resumen"
      tone={2}
    >
      <ul className="production-diseno-resumen__rows">
        {filas.map(row => (
          <li
            key={row.label}
            className={[
              'production-diseno-resumen__row',
              row.inactive ? 'production-diseno-resumen__row--inactive' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="production-diseno-resumen__row-label">{row.label}</span>
            <span className="production-diseno-resumen__row-value">
              {formatValor(row.value)}
            </span>
          </li>
        ))}
      </ul>
      <div className="production-diseno-resumen__total" aria-live="polite">
        <div className="production-diseno-resumen__total-info">
          <span className="production-diseno-resumen__total-label">Total</span>
        </div>
        <strong className="production-diseno-resumen__total-value">
          {formatValor(resumen.totalDiseno)}
        </strong>
      </div>
    </ProductionWorkspaceSection>
  )
}

export default DisenoTotalesResumen
