import React from 'react'
import clsx from 'clsx'
import ActionIcon from '../../components/ui/ActionIcon'
import { ColoresInkIcon } from './DisenoColoresPicker'
import { ESTIMAR_TINTAS_PROCESS_CMYK_SWATCHES } from './constants/preprensaDisenoColors'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  CMYK_CHANNELS,
  formatEstimarTintasCoverage,
  formatEstimarTintasWeightG,
} from './utils/estimarTintasUtils'
import type { EstimarTintasCorteDisplay, EstimarTintasTableRow } from './utils/estimarTintasRegistrosUtils'
import { resolveEntradaInkTotalsSnapshot } from './utils/estimarTintasRegistrosUtils'
import { EstimarTintasInkTotalsValueCell } from './EstimarTintasInkTotalsPanel'
import { sortPantoneDetectedColorsForDisplay, resolveEstimarTintasPantoneDisplaySwatch } from './utils/estimarTintasImageColorsUtils'
import type { ImpresionEstimarTintasEntrada } from '../../../core/domain/entities/Order'

const entradasCopy = copy.muestra.entradas
const channelsCopy = copy.muestra.channels
const channelNamesCopy = copy.muestra.channelNames

const TABLE_COL_COUNT = 10

interface EstimarTintasEntradasListProps {
  rows: EstimarTintasTableRow[]
  activeColorPlanchaId: string
  editingEntradaId: string | null
  onEdit: (colorPlanchaId: string, entradaId: string) => void
  onRemove: (colorPlanchaId: string, entradaId: string) => void
}

const formatMedidas = (widthCm: number, heightCm: number) =>
  `${widthCm.toFixed(1).replace('.', ',')} × ${heightCm.toFixed(1).replace('.', ',')} cm`

const EstimarTintasMedidaCell: React.FC<{ entrada: ImpresionEstimarTintasEntrada }> = ({ entrada }) => (
  <div className="production-impresion-tintas-precio-cell production-impresion-tintas-precio-cell--stack">
    <span className="production-impresion-tintas-precio-cell__millares">
      {formatMedidas(entrada.widthCm, entrada.heightCm)}
    </span>
    <span className="production-impresion-tintas-precio-cell__valor">
      {entradasCopy.dpiValueLabel(entrada.dpi)}
    </span>
  </div>
)

const EstimarTintasPapelDespieceCell: React.FC<{ corteDisplay: EstimarTintasCorteDisplay }> = ({
  corteDisplay,
}) => {
  const { tipoPapelDisplay, despieceDisplay } = corteDisplay
  if (!tipoPapelDisplay && !despieceDisplay) {
    return <span className="production-plancha-table__muted">—</span>
  }

  return (
    <div className="production-impresion-tintas-precio-cell production-impresion-tintas-precio-cell--stack">
      {tipoPapelDisplay ? (
        <span className="production-impresion-tintas-precio-cell__millares" title={tipoPapelDisplay}>
          {tipoPapelDisplay}
        </span>
      ) : null}
      {despieceDisplay ? (
        <span className="production-impresion-tintas-precio-cell__valor" title={despieceDisplay}>
          {despieceDisplay}
        </span>
      ) : null}
    </div>
  )
}

const EstimarTintasCmykTableCell: React.FC<{ entrada: ImpresionEstimarTintasEntrada }> = ({ entrada }) => (
  <div className="production-impresion-tintas-lado-grupos-cell">
    <div className="production-impresion-tintas-lado-grupo production-impresion-estimar-tintas-cmyk-grupo">
      <div className="production-impresion-estimar-tintas-cmyk-inline">
        {CMYK_CHANNELS.map(channel => {
          const label = channelsCopy[channel]
          const name = channelNamesCopy[channel]
          const coverage = entrada.coverage[channel]
          const grams = entrada.inkG[channel]

          return (
            <div
              key={channel}
              className={clsx(
                'production-impresion-estimar-tintas-cmyk-inline__item',
                `production-impresion-estimar-tintas-cmyk-inline__item--${channel}`
              )}
              title={`${label}: ${formatEstimarTintasCoverage(coverage)} · ${formatEstimarTintasWeightG(grams)}`}
            >
              <ColoresInkIcon
                swatch={ESTIMAR_TINTAS_PROCESS_CMYK_SWATCHES[channel]}
                name={label}
                size="sm"
              />
              <span className="production-impresion-estimar-tintas-cmyk-inline__name">{name}</span>
              <span className="production-impresion-estimar-tintas-cmyk-inline__coverage">
                {formatEstimarTintasCoverage(coverage)}
              </span>
              <span className="production-impresion-estimar-tintas-cmyk-inline__grams">
                {formatEstimarTintasWeightG(grams)}
              </span>
            </div>
          )
        })}
        {sortPantoneDetectedColorsForDisplay(entrada.detectedColors ?? []).map(color => (
          <div
            key={`${color.index}-${color.representativeSwatch ?? color.name}`}
            className={clsx(
              'production-impresion-estimar-tintas-cmyk-inline__item',
              color.category === 'pantone'
                ? 'production-impresion-estimar-tintas-cmyk-inline__item--pantone'
                : color.category === 'basico'
                  ? `production-impresion-estimar-tintas-cmyk-inline__item--${CMYK_CHANNELS[color.index]}`
                  : `production-impresion-estimar-tintas-cmyk-inline__item--spot-${color.index}`
            )}
            title={`${color.name}: ${formatEstimarTintasCoverage(color.coverage)} · ${formatEstimarTintasWeightG(color.inkG)}`}
          >
            <ColoresInkIcon
              swatch={resolveEstimarTintasPantoneDisplaySwatch(color)}
              name={color.name}
              size="sm"
            />
            <span className="production-impresion-estimar-tintas-cmyk-inline__name">{color.name}</span>
            <span className="production-impresion-estimar-tintas-cmyk-inline__coverage">
              {formatEstimarTintasCoverage(color.coverage)}
            </span>
            <span className="production-impresion-estimar-tintas-cmyk-inline__grams">
              {formatEstimarTintasWeightG(color.inkG)}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const EstimarTintasEntradasList: React.FC<EstimarTintasEntradasListProps> = ({
  rows,
  activeColorPlanchaId,
  editingEntradaId,
  onEdit,
  onRemove,
}) => (
  <div className="production-plancha-list">
    <div className="production-plancha-table-wrap">
      <table className="production-plancha-table production-plancha-table--impresion-tintas production-plancha-table--estimar-tintas">
        <thead>
          <tr>
            <th scope="col" className="production-plancha-table__th">
              {entradasCopy.tablePlancha}
            </th>
            <th scope="col" className="production-plancha-table__th">
              {entradasCopy.tablePapelDespiece}
            </th>
            <th scope="col" className="production-plancha-table__th">
              {entradasCopy.tableArchivo}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tableMedidas}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tablePliegos}
            </th>
            <th scope="col" className="production-plancha-table__th">
              {entradasCopy.tableConsumo}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tableTotalColorBasico}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tableTotalPantone}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tableTotalUnificado}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--act">
              <span className="sr-only">{entradasCopy.tableAcciones}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="production-plancha-table__row production-plancha-table__row--empty">
              <td
                colSpan={TABLE_COL_COUNT}
                className="production-plancha-table__td production-impresion-tintas-table__empty"
              >
                <strong>{entradasCopy.emptyTitle}</strong>
                <span>{entradasCopy.emptyGlobal}</span>
              </td>
            </tr>
          ) : (
            rows.map(({ colorPlanchaId, plancha, entrada, corteDisplay }) => {
              const isEditing = editingEntradaId === entrada.id
              const isActivePlancha = colorPlanchaId === activeColorPlanchaId
              const inkTotals = resolveEntradaInkTotalsSnapshot(entrada)
              const pedidoTotals = inkTotals.pedido ?? {
                processInkG: 0,
                pantoneInkG: 0,
                totalInkG: 0,
              }
              const planchaLabel = [
                plancha.planchaNombreMedida,
                plancha.detalle?.trim() ? plancha.detalle.trim() : '',
              ]
                .filter(Boolean)
                .join(' · ')

              return (
                <tr
                  key={entrada.id}
                  className={clsx(
                    'production-plancha-table__row',
                    isActivePlancha && 'production-plancha-table__row--selected',
                    isEditing && 'production-plancha-table__row--editing'
                  )}
                >
                  <td className="production-plancha-table__td" title={planchaLabel}>
                    <span className="production-plancha-table__truncate">{planchaLabel || '—'}</span>
                  </td>
                  <td className="production-plancha-table__td">
                    <EstimarTintasPapelDespieceCell corteDisplay={corteDisplay} />
                  </td>
                  <td className="production-plancha-table__td" title={entrada.fileName}>
                    <span className="production-plancha-table__truncate">{entrada.fileName}</span>
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    <EstimarTintasMedidaCell entrada={entrada} />
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    {entrada.totalPliegos.toLocaleString('es-CO')}
                  </td>
                  <td className="production-plancha-table__td">
                    <EstimarTintasCmykTableCell entrada={entrada} />
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    <EstimarTintasInkTotalsValueCell valueG={pedidoTotals.processInkG} />
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    <EstimarTintasInkTotalsValueCell valueG={pedidoTotals.pantoneInkG} />
                  </td>
                  <td
                    className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total"
                    title={`${entradasCopy.tableTotalUnificado}: CMYK + Pantone × pliegos`}
                  >
                    <EstimarTintasInkTotalsValueCell valueG={pedidoTotals.totalInkG} variant="unified" />
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--act">
                    <div className="production-impresion-tintas-table__actions">
                      <button
                        type="button"
                        className={clsx(
                          'action-icon-button action-icon-edit production-impresion-tintas-table__edit',
                          isEditing && 'production-impresion-tintas-table__edit--active'
                        )}
                        onClick={() => onEdit(colorPlanchaId, entrada.id)}
                        title={isEditing ? entradasCopy.editing : entradasCopy.edit}
                        aria-label={isEditing ? entradasCopy.editing : entradasCopy.edit}
                        aria-pressed={isEditing}
                      >
                        <ActionIcon name="edit" size={14} />
                      </button>
                      <button
                        type="button"
                        className="action-icon-button action-icon-delete production-plancha-table__remove"
                        onClick={() => onRemove(colorPlanchaId, entrada.id)}
                        title={entradasCopy.remove}
                        aria-label={entradasCopy.remove}
                      >
                        <ActionIcon name="delete" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
)

export default EstimarTintasEntradasList
