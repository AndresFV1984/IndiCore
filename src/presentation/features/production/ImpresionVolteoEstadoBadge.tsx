import React from 'react'
import clsx from 'clsx'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import type { ImpresionTintasResumenVolteoEstado } from './utils/impresionPrecioTintaUtils'

const resumenCopy = copy.tintas.resumen
const volteoCopy = copy.tintas.tintasVolteo

export const formatImpresionVolteoEstadoLabel = (
  estado: ImpresionTintasResumenVolteoEstado
): string | null => {
  if (!estado) return null
  if (estado === 'con') return resumenCopy.totalConVolteo
  if (estado === 'sin') return resumenCopy.totalSinVolteo
  return resumenCopy.totalVolteoMixto
}

interface ImpresionVolteoEstadoBadgeProps {
  estado?: ImpresionTintasResumenVolteoEstado
  conVolteo?: boolean
  className?: string
}

const ImpresionVolteoEstadoBadge: React.FC<ImpresionVolteoEstadoBadgeProps> = ({
  estado,
  conVolteo,
  className,
}) => {
  let label: string | null = null
  let tone: 'con' | 'sin' | 'mixto' = 'sin'

  if (estado !== undefined) {
    label = formatImpresionVolteoEstadoLabel(estado)
    if (!label) return null
    tone = estado === 'mixto' ? 'mixto' : estado === 'con' ? 'con' : 'sin'
  } else if (conVolteo !== undefined) {
    label = conVolteo ? volteoCopy.volteoStatusCon : volteoCopy.volteoStatusSin
    tone = conVolteo ? 'con' : 'sin'
  } else {
    return null
  }

  return (
    <span
      className={clsx(
        'production-impresion-tintas-resumen__volteo-badge',
        tone === 'con' && 'production-impresion-tintas-resumen__volteo-badge--con',
        tone === 'sin' && 'production-impresion-tintas-resumen__volteo-badge--sin',
        tone === 'mixto' && 'production-impresion-tintas-resumen__volteo-badge--mixto',
        className
      )}
    >
      {label}
    </span>
  )
}

export default ImpresionVolteoEstadoBadge
