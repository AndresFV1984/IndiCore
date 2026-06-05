import React, { useMemo } from 'react'
import clsx from 'clsx'
import type { ImpresionTintasRegistro } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { buildImpresionTintasResumenConsolidado } from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'

const resumenCopy = copy.tintas.resumen

const formatValor = (value: number) =>
  value > 0 ? formatPrecioMillar(value) : resumenCopy.empty

interface ProductionImpresionTintasResumenProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  registros: ImpresionTintasRegistro[]
  activeColorPlanchaId: string
  onSelectPlancha: (id: string) => void
}

const ProductionImpresionTintasResumen: React.FC<ProductionImpresionTintasResumenProps> = ({
  coloresPlanchas,
  registros,
  activeColorPlanchaId,
  onSelectPlancha,
}) => {
  const resumen = useMemo(
    () => buildImpresionTintasResumenConsolidado(coloresPlanchas, registros),
    [coloresPlanchas, registros]
  )

  const completados = resumen.registros.filter(line => line.completo).length

  if (resumen.registros.length === 0) return null

  const totalesLines = [
    { label: resumenCopy.totalColorBasico, value: resumen.totales.precioTintaColorBasico },
    { label: resumenCopy.totalPantone, value: resumen.totales.precioTintaPantone },
    { label: resumenCopy.totalVolteo, value: resumen.totales.precioVolteo },
  ]

  return (
    <ProductionWorkspaceSection
      className="production-impresion-tintas-resumen"
      tag={copy.tintas.sectionTags.resumen}
      title={resumenCopy.title}
      subtitle={resumenCopy.subtitle(completados, resumen.registros.length)}
      tone={1}
    >
      <div className="production-plancha-table-wrap">
        <table className="production-plancha-table production-impresion-tintas-resumen__table">
          <thead>
            <tr>
              <th scope="col" className="production-plancha-table__th">
                Plancha
              </th>
              <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
                {resumenCopy.precioColorBasico}
              </th>
              <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
                {resumenCopy.precioPantone}
              </th>
              <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
                {resumenCopy.precioVolteo}
              </th>
              <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
                {resumenCopy.totalPlancha}
              </th>
            </tr>
          </thead>
          <tbody>
            {resumen.registros.map((line, index) => {
              const isActive = line.colorPlanchaId === activeColorPlanchaId

              return (
                <tr
                  key={line.colorPlanchaId}
                  className={clsx(
                    'production-plancha-table__row',
                    'production-impresion-tintas-resumen__row',
                    isActive && 'production-plancha-table__row--selected',
                    !line.completo && 'production-impresion-tintas-resumen__row--pendiente'
                  )}
                >
                  <td className="production-plancha-table__td">
                    <button
                      type="button"
                      className="production-impresion-tintas-resumen__plancha-btn"
                      onClick={() => onSelectPlancha(line.colorPlanchaId)}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="production-impresion-tintas-resumen__plancha-index">
                        {resumenCopy.registroIndex(index + 1)}
                      </span>
                      <span className="production-impresion-tintas-resumen__plancha-label">
                        {line.label}
                      </span>
                      <span
                        className={clsx(
                          'production-impresion-tintas-resumen__estado',
                          line.completo
                            ? 'production-impresion-tintas-resumen__estado--ok'
                            : 'production-impresion-tintas-resumen__estado--pendiente'
                        )}
                      >
                        {line.completo
                          ? resumenCopy.registroCompletado
                          : resumenCopy.registroPendiente}
                      </span>
                    </button>
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    {formatValor(line.precioTintaColorBasico)}
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    {formatValor(line.precioTintaPantone)}
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    {formatValor(line.precioVolteo)}
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total">
                    {formatValor(line.totalCobrar)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="production-impresion-tintas-resumen__totales">
        {totalesLines.map(line => (
          <div key={line.label} className="production-impresion-tintas-resumen__totales-line">
            <span>{line.label}</span>
            <span>{formatValor(line.value)}</span>
          </div>
        ))}
        <div className="production-impresion-tintas-resumen__total" aria-live="polite">
          <div className="production-impresion-tintas-resumen__total-info">
            <span className="production-impresion-tintas-resumen__total-label">
              {resumenCopy.totalLabel}
            </span>
            <span className="production-impresion-tintas-resumen__total-hint">
              {resumenCopy.totalHint}
            </span>
          </div>
          <strong className="production-impresion-tintas-resumen__total-value">
            {formatValor(resumen.totales.totalCobrar)}
          </strong>
        </div>
      </div>
    </ProductionWorkspaceSection>
  )
}

export default ProductionImpresionTintasResumen
