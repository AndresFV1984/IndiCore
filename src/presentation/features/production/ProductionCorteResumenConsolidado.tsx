import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import CortePapelFaltanteMarca from './CortePapelFaltanteMarca'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import {
  buildCorteResumenConsolidado,
  type CorteRegistroResumenLine,
} from './utils/paperRowsSync'
import { formatValorHojaDisplay } from './utils/tipoPapelDisplay'

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const fmtCantidad = (value: number): string =>
  value > 0 ? value.toLocaleString('es-CO') : copy.resumen.empty

const fmtMoney = (value: number): string =>
  value > 0 ? formatValorHojaDisplay(value) : copy.resumen.empty

interface RegistroMetric {
  label: string
  value: string
}

const buildRegistroMetrics = (line: CorteRegistroResumenLine): RegistroMetric[] => [
  {
    label: copy.resumen.registroTipoPapel,
    value: line.tipoPapel.trim() || copy.resumen.empty,
  },
  {
    label: copy.resumen.registroPiezasPorPliego,
    value: line.piezasPorPliego > 0 ? fmtCantidad(line.piezasPorPliego) : copy.resumen.empty,
  },
  {
    label: copy.resumen.registroValorCorteUnitario,
    value: fmtMoney(line.valorCorteUnitario),
  },
  {
    label: copy.resumen.registroCantidadHojas,
    value: fmtCantidad(line.cantidadHojas),
  },
  {
    label: copy.resumen.valorPapelLabel,
    value: fmtMoney(line.valorPapel),
  },
  {
    label: copy.resumen.registroValorCorte,
    value: fmtMoney(line.valorCorte),
  },
]

interface ProductionCorteResumenConsolidadoProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  paperRows: PaperRow[]
  tiposPapel: TipoPapel[]
  margenRedondeo: number
  clienteSuministraPapel: YesNoChoice
  activeColorPlanchaId: string
  onSelectRegistro: (id: string) => void
}

const ProductionCorteResumenConsolidado: React.FC<ProductionCorteResumenConsolidadoProps> = ({
  coloresPlanchas,
  paperRows,
  tiposPapel,
  margenRedondeo,
  clienteSuministraPapel,
  activeColorPlanchaId,
  onSelectRegistro,
}) => {
  const resumen = useMemo(
    () =>
      buildCorteResumenConsolidado(
        coloresPlanchas,
        paperRows,
        tiposPapel,
        margenRedondeo,
        clienteSuministraPapel
      ),
    [coloresPlanchas, paperRows, tiposPapel, margenRedondeo, clienteSuministraPapel]
  )

  const completados = resumen.registros.filter(line => line.completo).length

  if (resumen.registros.length === 0) return null

  return (
    <ProductionWorkspaceSection
      className="production-corte-resumen-consolidado production-diseno-resumen"
      tag={copy.sectionTags.resumen}
      title={copy.resumen.title}
      subtitle={copy.resumen.subtitleCompacto(completados, resumen.registros.length)}
      tone={2}
    >
      <ul className="production-corte-resumen-consolidado__registros">
        {resumen.registros.map((line, index) => {
          const lineActiveId = line.corteRowId ?? line.colorPlanchaId
          const isActive = lineActiveId === activeColorPlanchaId
          const metrics = buildRegistroMetrics(line)

          return (
            <li
              key={line.corteRowId ?? line.colorPlanchaId}
              className={[
                'production-corte-resumen-consolidado__registro',
                'production-corte-resumen-consolidado__registro--editable',
                isActive ? 'production-corte-resumen-consolidado__registro--active' : '',
                line.completo ? 'production-corte-resumen-consolidado__registro--completo' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="production-corte-resumen-consolidado__registro-toolbar">
                <button
                  type="button"
                  className="production-corte-resumen-consolidado__registro-trigger"
                  onClick={() => onSelectRegistro(lineActiveId)}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={`${copy.resumen.registroEditar}: ${line.label}`}
                >
                  <div className="production-corte-resumen-consolidado__registro-head">
                    <div className="production-corte-resumen-consolidado__registro-title-wrap">
                      <span className="production-corte-resumen-consolidado__registro-index">
                        Registro {index + 1}
                      </span>
                      <strong className="production-corte-resumen-consolidado__registro-title">
                        {line.shortLabel}
                      </strong>
                    </div>
                    <div className="production-corte-resumen-consolidado__registro-badges">
                      {line.esFaltanteLitografia ? (
                        <CortePapelFaltanteMarca compact />
                      ) : null}
                      {isActive ? (
                        <span className="production-corte-resumen-consolidado__estado production-corte-resumen-consolidado__estado--editando">
                          {copy.resumen.registroEditandoCorto}
                        </span>
                      ) : null}
                      <span
                        className={[
                          'production-corte-resumen-consolidado__estado',
                          line.completo
                            ? 'production-corte-resumen-consolidado__estado--ok'
                            : 'production-corte-resumen-consolidado__estado--pendiente',
                        ].join(' ')}
                      >
                        {line.completo
                          ? copy.resumen.registroCompletado
                          : copy.resumen.registroPendiente}
                      </span>
                    </div>
                  </div>
                  <span
                    className={[
                      'production-corte-resumen-consolidado__registro-edit-hint',
                      isActive
                        ? 'production-corte-resumen-consolidado__registro-edit-hint--active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isActive ? copy.resumen.registroEditando : copy.resumen.registroEditarHint}
                  </span>
                </button>
              </div>

              <dl className="production-corte-resumen-consolidado__registro-metrics">
                {metrics.map(metric => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          )
        })}
      </ul>

      <div className="production-corte-resumen-consolidado__totales">
        <ul className="production-diseno-resumen__rows">
          <li className="production-diseno-resumen__row">
            <span className="production-diseno-resumen__row-label">
              {copy.resumen.totalCantidadHojas}
            </span>
            <span className="production-diseno-resumen__row-value">
              {fmtCantidad(resumen.totales.cantidadHojas)}
            </span>
          </li>
          <li className="production-diseno-resumen__row">
            <span className="production-diseno-resumen__row-label">
              {copy.resumen.totalValorPapel}
            </span>
            <span className="production-diseno-resumen__row-value">
              {fmtMoney(resumen.totales.valorPapel)}
            </span>
          </li>
        </ul>
        <div className="production-diseno-resumen__total" aria-live="polite">
          <div className="production-diseno-resumen__total-info">
            <span className="production-diseno-resumen__total-label">{copy.resumen.totalLabel}</span>
            <span className="production-diseno-resumen__total-hint">
              {copy.resumen.totalHintConsolidado}
            </span>
          </div>
          <strong className="production-diseno-resumen__total-value">
            {resumen.totales.valorCorte > 0
              ? formatValor(resumen.totales.valorCorte)
              : copy.resumen.empty}
          </strong>
        </div>
      </div>
    </ProductionWorkspaceSection>
  )
}

export default ProductionCorteResumenConsolidado
