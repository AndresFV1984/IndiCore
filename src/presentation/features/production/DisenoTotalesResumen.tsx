import React, { useMemo } from 'react'
import { PreprensaDisenoSpecs } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionOrdenResumenSection from './ProductionOrdenResumenSection'
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
      key: 'diseno',
      label: resumenCopy.valorDiseno,
      value: formatValor(resumen.costoDiseno),
      inactive: resumen.costoDiseno <= 0,
    },
    {
      key: 'planchas',
      label: resumenCopy.valorPlanchas,
      value: formatValor(resumen.valorTotalPlanchas),
      inactive: resumen.valorTotalPlanchas <= 0,
    },
    {
      key: 'montaje',
      label: resumenCopy.valorMontaje,
      value: formatValor(resumen.precioMontaje),
      inactive: resumen.precioMontaje <= 0,
    },
  ]

  return (
    <ProductionOrdenResumenSection
      rows={filas}
      totalLabel={resumenCopy.total}
      totalValue={formatValor(resumen.totalDiseno)}
      hint={
        clienteSuministraPlanchas ? copy.planchaSuministro.resumenPlanchasCliente : undefined
      }
    />
  )
}

export default DisenoTotalesResumen
