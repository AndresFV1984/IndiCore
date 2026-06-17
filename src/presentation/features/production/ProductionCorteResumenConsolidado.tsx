import React, { useMemo } from 'react'
import { confirmAction } from '../../utils/actionFeedback'
import ActionIcon from '../../components/ui/ActionIcon'
import { LIST_RECORD_ACTION_ICON_SIZE } from '../../constants/listRecordActions'
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

const RegistroInlineMeta: React.FC<{
  label: string
  value: string
  variant?: 'estado' | 'padre'
}> = ({ label, value, variant = 'estado' }) => (
  <div
    className={[
      'production-corte-resumen-consolidado__registro-meta',
      variant === 'padre'
        ? 'production-corte-resumen-consolidado__registro-meta--padre'
        : 'production-corte-resumen-consolidado__registro-meta--estado',
    ].join(' ')}
  >
    <span className="production-corte-resumen-consolidado__registro-meta-label">{label}</span>
    <span className="production-corte-resumen-consolidado__registro-meta-value">{value}</span>
  </div>
)

interface RegistroMetric {
  label: string
  value: string
  tone?: 'faltante'
}

const buildRegistroMetrics = (line: CorteRegistroResumenLine): RegistroMetric[] => {
  const metrics: RegistroMetric[] = [
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
      label: copy.resumen.registroValorHoja,
      value: fmtMoney(line.valorHoja),
    },
    {
      label: copy.resumen.registroCantidadHojas,
      value: fmtCantidad(line.cantidadHojas),
    },
  ]

  if (!line.esFaltanteLitografia && (line.hojasFaltanteRestadas ?? 0) > 0) {
    metrics.push({
      label: copy.resumen.registroHojasFaltanteRestadas,
      value: fmtCantidad(line.hojasFaltanteRestadas!),
      tone: 'faltante',
    })
  }

  metrics.push(
    {
      label: copy.resumen.registroValorTotalPapel,
      value: fmtMoney(line.valorPapel),
    },
    {
      label: copy.resumen.registroValorCorte,
      value: fmtMoney(line.valorCorte),
    }
  )

  return metrics
}

interface ProductionCorteResumenConsolidadoProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  paperRows: PaperRow[]
  tiposPapel: TipoPapel[]
  margenRedondeo: number
  clienteSuministraPapel: YesNoChoice
  activeColorPlanchaId: string
  onSelectRegistro: (id: string) => void
  onDeleteRegistro: (activeId: string) => void
}

const ProductionCorteResumenConsolidado: React.FC<ProductionCorteResumenConsolidadoProps> = ({
  coloresPlanchas,
  paperRows,
  tiposPapel,
  margenRedondeo,
  clienteSuministraPapel,
  activeColorPlanchaId,
  onSelectRegistro,
  onDeleteRegistro,
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

  const registrosCompletados = useMemo(
    () => resumen.registros.filter(line => line.completo),
    [resumen.registros]
  )

  const totalesCompletados = useMemo(
    () =>
      registrosCompletados.reduce(
        (acc, line) => ({
          cantidadHojas: acc.cantidadHojas + line.cantidadHojas,
          valorPapel: acc.valorPapel + line.valorPapel,
          valorCorte: acc.valorCorte + line.valorCorte,
        }),
        { cantidadHojas: 0, valorPapel: 0, valorCorte: 0 }
      ),
    [registrosCompletados]
  )

  const handleDelete = async (line: CorteRegistroResumenLine, lineActiveId: string) => {
    if (
      !(await confirmAction(copy.resumen.registroEliminarConfirm(line.shortLabel), {
        title: copy.resumen.registroEliminar,
        confirmLabel: copy.resumen.registroEliminar,
        variant: 'danger',
      }))
    ) {
      return
    }
    onDeleteRegistro(lineActiveId)
  }

  if (registrosCompletados.length === 0) return null

  return (
    <ProductionWorkspaceSection
      className="production-corte-resumen-consolidado production-diseno-resumen"
      tag={copy.sectionTags.resumen}
      title={copy.resumen.title}
      subtitle={copy.resumen.subtitleCompacto(
        registrosCompletados.length,
        registrosCompletados.length
      )}
      tone={2}
    >
      <ul className="production-corte-resumen-consolidado__registros">
        {registrosCompletados.map((line, index) => {
          const lineActiveId = line.corteRowId ?? line.colorPlanchaId
          const isActive = lineActiveId === activeColorPlanchaId
          const metrics = buildRegistroMetrics(line)
          const iconSize = LIST_RECORD_ACTION_ICON_SIZE

          return (
            <li
              key={line.corteRowId ?? line.colorPlanchaId}
              className={[
                'production-corte-resumen-consolidado__registro',
                'production-corte-resumen-consolidado__registro--editable',
                isActive ? 'production-corte-resumen-consolidado__registro--active' : '',
                'production-corte-resumen-consolidado__registro--completo',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="production-corte-resumen-consolidado__registro-toolbar">
                <div className="production-corte-resumen-consolidado__registro-head">
                  <div className="production-corte-resumen-consolidado__registro-title-wrap">
                    <div className="production-corte-resumen-consolidado__registro-title-row">
                      <div className="production-corte-resumen-consolidado__registro-heading">
                        <span className="production-corte-resumen-consolidado__registro-index">
                          Registro {index + 1}
                        </span>
                        <strong className="production-corte-resumen-consolidado__registro-title">
                          {line.shortLabel}
                        </strong>
                      </div>
                      <RegistroInlineMeta
                        label={copy.resumen.registroEstadoPapel}
                        value={line.estadoPapelLabel}
                        variant="estado"
                      />
                      {line.esFaltanteLitografia && line.parentLabel?.trim() ? (
                        <RegistroInlineMeta
                          label={copy.resumen.registroPadre}
                          value={line.parentLabel.trim()}
                          variant="padre"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="production-corte-resumen-consolidado__registro-badges">
                    {line.esFaltanteLitografia ? <CortePapelFaltanteMarca compact /> : null}
                    {isActive ? (
                      <span className="production-corte-resumen-consolidado__estado production-corte-resumen-consolidado__estado--editando">
                        {copy.resumen.registroEditandoCorto}
                      </span>
                    ) : (
                      <span className="production-corte-resumen-consolidado__estado production-corte-resumen-consolidado__estado--ok">
                        {copy.resumen.registroCompletado}
                      </span>
                    )}
                  </div>
                </div>

                <div className="production-corte-resumen-consolidado__registro-actions">
                  <button
                    type="button"
                    className={[
                      'action-icon-button action-icon-edit production-corte-resumen-consolidado__registro-edit',
                      isActive ? 'production-corte-resumen-consolidado__registro-edit--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onSelectRegistro(lineActiveId)}
                    title={copy.resumen.registroEditar}
                    aria-label={`${copy.resumen.registroEditar}: ${line.shortLabel}`}
                    aria-pressed={isActive}
                  >
                    <ActionIcon name="edit" size={iconSize} />
                  </button>
                  <button
                    type="button"
                    className="action-icon-button action-icon-delete production-corte-resumen-consolidado__registro-remove"
                    onClick={() => void handleDelete(line, lineActiveId)}
                    title={copy.resumen.registroEliminar}
                    aria-label={copy.resumen.registroEliminarAria(line.shortLabel)}
                  >
                    <ActionIcon name="delete" size={iconSize} />
                  </button>
                </div>
              </div>

              <dl className="production-corte-resumen-consolidado__registro-metrics">
                {metrics.map(metric => (
                  <div
                    key={metric.label}
                    className={[
                      'production-corte-resumen-consolidado__metric',
                      metric.tone === 'faltante'
                        ? 'production-corte-resumen-consolidado__metric--faltante'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
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
              {copy.resumen.totalValorPapel}
            </span>
            <span className="production-diseno-resumen__row-value">
              {fmtMoney(totalesCompletados.valorPapel)}
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
            {totalesCompletados.valorCorte > 0
              ? formatValor(totalesCompletados.valorCorte)
              : copy.resumen.empty}
          </strong>
        </div>
      </div>
    </ProductionWorkspaceSection>
  )
}

export default ProductionCorteResumenConsolidado
