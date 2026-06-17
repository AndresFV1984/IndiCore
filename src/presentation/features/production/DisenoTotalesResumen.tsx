import React, { useMemo } from 'react'
import { PreprensaDisenoSpecs } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { PREPRENSA_DISENO_COPY as copy } from './constants/preprensaDisenoCopy'
import { computeDisenoResumenTotales } from './utils/preprensaDisenoTotales'

const resumenCopy = copy.nuevo.resumen

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
  const clienteSuministraPlanchas = diseno.coloresPlanchas.some(
    item => (item.clienteSuministraPlanchas ?? diseno.clienteSuministraPlanchas ?? 'no') === 'si'
  )

  const filas = [
    {
      label: resumenCopy.valorDiseno,
      value: resumen.costoDiseno,
      inactive: resumen.costoDiseno <= 0,
    },
    {
      label: resumenCopy.valorPlanchas,
      value: resumen.valorTotalPlanchas,
      inactive: resumen.valorTotalPlanchas <= 0,
    },
    {
      label: resumenCopy.valorMontaje,
      value: resumen.precioMontaje,
      inactive: resumen.precioMontaje <= 0,
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
      {clienteSuministraPlanchas ? (
        <p className="production-diseno-resumen__hint production-diseno-cliente-hint production-diseno-cliente-hint--aviso">
          {copy.planchaSuministro.resumenPlanchasCliente}
        </p>
      ) : null}
      <div className="production-diseno-resumen__total" aria-live="polite">
        <div className="production-diseno-resumen__total-info">
          <span className="production-diseno-resumen__total-label">{resumenCopy.total}</span>
        </div>
        <strong className="production-diseno-resumen__total-value">
          {formatValor(resumen.totalDiseno)}
        </strong>
      </div>
    </ProductionWorkspaceSection>
  )
}

export default DisenoTotalesResumen
