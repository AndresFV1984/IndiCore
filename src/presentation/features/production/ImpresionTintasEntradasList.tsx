import React from 'react'
import clsx from 'clsx'
import type { ImpresionLadoTintas } from '../../../core/domain/entities/Order'
import ActionIcon from '../../components/ui/ActionIcon'
import { ColoresCountIcons, ColoresInkIcon } from './DisenoColoresPicker'
import { DISENO_INK_PALETTE } from './constants/preprensaDisenoColors'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { getColoresOptionMeta } from './utils/coloresPlanchasUtils'
import {
  type ImpresionTintasTableRow,
  isValidImpresionTintaIndex,
  normalizeImpresionInkIndex,
  sumImpresionEntradaTintas,
} from './utils/impresionTintasUtils'
import {
  formatMillaresFactor,
  resolveEntradaRegistroResumen,
} from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'

const entradasCopy = copy.tintas.entradas
const ladoCopy = copy.tintas.lado

interface ImpresionTintasEntradasListProps {
  rows: ImpresionTintasTableRow[]
  activeColorPlanchaId: string
  editingEntradaId: string | null
  onEdit: (colorPlanchaId: string, entradaId: string) => void
  onRemove: (colorPlanchaId: string, entradaId: string) => void
}

const formatLadoTintasNames = (lado: ImpresionLadoTintas): string[] => {
  if (lado.cantidad <= 0) return []
  return lado.tintas.slice(0, lado.cantidad).map(index => {
    const normalized = normalizeImpresionInkIndex(index)
    return isValidImpresionTintaIndex(normalized)
      ? DISENO_INK_PALETTE[normalized]!.name
      : ladoCopy.slotSinAsignar
  })
}

const ImpresionLadoTintasTableCell: React.FC<{ lado: ImpresionLadoTintas }> = ({ lado }) => {
  if (lado.cantidad <= 0) {
    return <span className="production-plancha-table__muted">{entradasCopy.ladoSinTintas}</span>
  }

  const tintas = lado.tintas.slice(0, lado.cantidad)
  const names = formatLadoTintasNames(lado)

  return (
    <div
      className="production-impresion-tintas-lado-cell production-impresion-tintas-lado-cell--inline"
      title={names.join(', ')}
    >
      <span className="production-impresion-tintas-lado-cell__count">
        {entradasCopy.ladoTintas(lado.cantidad)}
      </span>
      <span className="production-colores-icons production-colores-icons--sm">
        {tintas.map((inkIndex, index) => {
          const normalized = normalizeImpresionInkIndex(inkIndex)
          const ink = isValidImpresionTintaIndex(normalized) ? DISENO_INK_PALETTE[normalized] : null
          if (ink) {
            return <ColoresInkIcon key={index} swatch={ink.swatch} name={ink.name} size="sm" />
          }
          return (
            <span
              key={index}
              className="production-impresion-tintas-table__pending"
              title={ladoCopy.slotSinAsignar}
              aria-hidden
            />
          )
        })}
      </span>
    </div>
  )
}

const TintasGrupoCountCell: React.FC<{ count: number; millares: number }> = ({ count, millares }) => (
  <div className="production-impresion-tintas-grupo-cell">
    <span className="production-impresion-tintas-grupo-cell__count">
      {count > 0 ? entradasCopy.tintasCountLabel(count) : entradasCopy.millaresEmpty}
    </span>
    {count > 0 ? (
      <span className="production-impresion-tintas-grupo-cell__millares">
        {entradasCopy.millaresValueLabel}: {formatMillaresFactor(millares)}
      </span>
    ) : null}
  </div>
)

const PrecioTintaCell: React.FC<{ value: number }> = ({ value }) => (
  <span className="production-impresion-tintas-precio-cell">
    {value > 0 ? formatPrecioMillar(value) : entradasCopy.millaresEmpty}
  </span>
)

const ImpresionTintasEntradasList: React.FC<ImpresionTintasEntradasListProps> = ({
  rows,
  activeColorPlanchaId,
  editingEntradaId,
  onEdit,
  onRemove,
}) => (
  <div className="production-plancha-list">
    <div className="production-plancha-table-wrap">
      <table className="production-plancha-table production-plancha-table--impresion-tintas">
        <thead>
          <tr>
            <th scope="col" className="production-plancha-table__th">
              {entradasCopy.tablePlancha}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--color">
              {entradasCopy.tableCantidadColores}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tableTintasColorBasico}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tableTintasPantone}
            </th>
            <th scope="col" className="production-plancha-table__th">
              {entradasCopy.tableTiro}
            </th>
            <th scope="col" className="production-plancha-table__th">
              {entradasCopy.tableRetiro}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tableTotal}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tablePrecioColorBasico}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tablePrecioPantone}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--num">
              {entradasCopy.tablePrecioVolteo}
            </th>
            <th scope="col" className="production-plancha-table__th production-plancha-table__th--act">
              <span className="sr-only">{entradasCopy.tableAcciones}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="production-plancha-table__row production-plancha-table__row--empty">
              <td colSpan={11} className="production-plancha-table__td production-impresion-tintas-table__empty">
                <strong>{entradasCopy.emptyTitle}</strong>
                <span>{entradasCopy.emptyGlobal}</span>
              </td>
            </tr>
          ) : (
            rows.map(({ colorPlanchaId, plancha, entrada, maxColoresPlancha }) => {
              const total = sumImpresionEntradaTintas(entrada)
              const resumen = resolveEntradaRegistroResumen(entrada)
              const isEditing = editingEntradaId === entrada.id
              const isActivePlancha = colorPlanchaId === activeColorPlanchaId
              const coloresMeta = getColoresOptionMeta(plancha.colores)
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
                  <td className="production-plancha-table__td production-plancha-table__td--color">
                    <span className="production-plancha-table__color" title={coloresMeta.label}>
                      <ColoresCountIcons
                        count={coloresMeta.count}
                        size="sm"
                        showPlusSuffix={plancha.colores === '7-colores-o-mas'}
                      />
                      <span className="production-plancha-table__color-tag">{coloresMeta.shortLabel}</span>
                    </span>
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    <TintasGrupoCountCell
                      count={resumen.cantidadTintasColorBasico}
                      millares={resumen.millaresColorBasico}
                    />
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    <TintasGrupoCountCell
                      count={resumen.cantidadTintasPantone}
                      millares={resumen.millaresPantone}
                    />
                  </td>
                  <td className="production-plancha-table__td">
                    <ImpresionLadoTintasTableCell lado={entrada.tiro} />
                  </td>
                  <td className="production-plancha-table__td">
                    <ImpresionLadoTintasTableCell lado={entrada.retiro} />
                  </td>
                  <td
                    className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total"
                    title={entradasCopy.totalTintas(total, maxColoresPlancha)}
                  >
                    <span className="production-impresion-tintas-total-cell">
                      {entradasCopy.totalValores(entrada.tiro.cantidad, entrada.retiro.cantidad)}
                    </span>
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    <PrecioTintaCell value={resumen.precioTintaColorBasico} />
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    <PrecioTintaCell value={resumen.precioTintaPantone} />
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num">
                    <PrecioTintaCell value={resumen.precioVolteo} />
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

export default ImpresionTintasEntradasList
