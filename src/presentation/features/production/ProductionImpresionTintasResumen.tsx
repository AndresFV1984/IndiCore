import React, { useMemo } from 'react'
import clsx from 'clsx'
import type { ImpresionTintasRegistro } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  buildImpresionTintasResumenConsolidado,
  type ImpresionTintasResumenVolteoEstado,
} from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'

const resumenCopy = copy.tintas.resumen
const volteoCopy = copy.tintas.tintasVolteo

const formatValor = (value: number) =>
  value > 0 ? formatPrecioMillar(value) : resumenCopy.empty

const resolveVolteoBadge = (estado: ImpresionTintasResumenVolteoEstado): string | null => {
  if (!estado) return null
  if (estado === 'con') return resumenCopy.totalConVolteo
  if (estado === 'sin') return resumenCopy.totalSinVolteo
  return resumenCopy.totalVolteoMixto
}

interface ProductionImpresionTintasResumenProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  registros: ImpresionTintasRegistro[]
}

const ProductionImpresionTintasResumen: React.FC<ProductionImpresionTintasResumenProps> = ({
  coloresPlanchas,
  registros,
}) => {
  const resumen = useMemo(
    () => buildImpresionTintasResumenConsolidado(coloresPlanchas, registros),
    [coloresPlanchas, registros]
  )

  const completados = resumen.registros.filter(line => line.completo).length
  const totalPlanchas = resumen.registros.length
  const progresoPct = totalPlanchas > 0 ? Math.round((completados / totalPlanchas) * 100) : 0

  if (resumen.registros.length === 0) return null

  const totalesLines = [
    {
      key: 'colorBasico',
      shortLabel: volteoCopy.badgeColorBasico,
      label: resumenCopy.totalColorBasico,
      value: resumen.totales.precioTintaColorBasico,
      volteo: resumen.totales.volteoColorBasico,
    },
    {
      key: 'pantone',
      shortLabel: volteoCopy.badgePantone,
      label: resumenCopy.totalPantone,
      value: resumen.totales.precioTintaPantone,
      volteo: resumen.totales.volteoPantone,
    },
  ] as const

  return (
    <ProductionWorkspaceSection
      className="production-impresion-tintas-resumen production-impresion-tintas-resumen--modern"
      tag={copy.tintas.sectionTags.resumen}
      title={resumenCopy.title}
      subtitle={resumenCopy.subtitle(completados, totalPlanchas)}
      tone={1}
    >
      <div className="production-impresion-tintas-resumen__layout">
        <div className="production-impresion-tintas-resumen__progress" aria-hidden>
          <div
            className="production-impresion-tintas-resumen__progress-ring"
            style={{ '--resumen-progress': `${progresoPct}%` } as React.CSSProperties}
          >
            <span className="production-impresion-tintas-resumen__progress-value">{progresoPct}%</span>
          </div>
          <div className="production-impresion-tintas-resumen__progress-copy">
            <span className="production-impresion-tintas-resumen__progress-title">
              {resumenCopy.subtitle(completados, totalPlanchas)}
            </span>
            <span className="production-impresion-tintas-resumen__progress-hint">
              {resumenCopy.totalHint}
            </span>
          </div>
        </div>

        <div className="production-impresion-tintas-resumen__metrics">
          {totalesLines.map(line => {
            const volteoBadge = resolveVolteoBadge(line.volteo)

            return (
              <article
                key={line.key}
                className={clsx(
                  'production-impresion-tintas-resumen__metric',
                  `production-impresion-tintas-resumen__metric--${line.key}`
                )}
              >
                <div className="production-impresion-tintas-resumen__metric-head">
                  <span className="production-impresion-tintas-resumen__metric-tag">{line.shortLabel}</span>
                  {volteoBadge ? (
                    <span
                      className={clsx(
                        'production-impresion-tintas-resumen__volteo-badge',
                        (line.volteo === 'con' || line.volteo === 'mixto') &&
                          'production-impresion-tintas-resumen__volteo-badge--con',
                        line.volteo === 'sin' && 'production-impresion-tintas-resumen__volteo-badge--sin'
                      )}
                    >
                      {volteoBadge}
                    </span>
                  ) : null}
                </div>
                <span className="production-impresion-tintas-resumen__metric-label">{line.label}</span>
                <strong className="production-impresion-tintas-resumen__metric-value">
                  {formatValor(line.value)}
                </strong>
              </article>
            )
          })}
        </div>

        <footer className="production-impresion-tintas-resumen__grand" aria-live="polite">
          <div className="production-impresion-tintas-resumen__grand-info">
            <span className="production-impresion-tintas-resumen__grand-label">
              {resumenCopy.totalLabel}
            </span>
            <span className="production-impresion-tintas-resumen__grand-hint">
              {resumenCopy.totalHint}
            </span>
          </div>
          <strong className="production-impresion-tintas-resumen__grand-value">
            {formatValor(resumen.totales.totalCobrar)}
          </strong>
        </footer>
      </div>
    </ProductionWorkspaceSection>
  )
}

export default ProductionImpresionTintasResumen
