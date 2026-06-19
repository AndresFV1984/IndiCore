import React from 'react'
import clsx from 'clsx'
import type { ImpresionLadoTintas } from '../../../core/domain/entities/Order'
import ActionIcon from '../../components/ui/ActionIcon'
import { ColoresInkIcon } from './DisenoColoresPicker'
import { DISENO_INK_PALETTE } from './constants/preprensaDisenoColors'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  countLadoInkIndicesByGrupo,
  filterLadoInkIndicesByGrupo,
  isValidImpresionTintaIndex,
  normalizeImpresionInkIndex,
  sumImpresionEntradaTintas,
  type ImpresionTintasGrupoVariant,
  type ImpresionTintasTableRow,
} from './utils/impresionTintasUtils'
import {
  formatMillaresFactor,
  resolveEntradaRegistroResumen,
  resolveRegistroConVolteoColorBasico,
  resolveRegistroConVolteoPantone,
} from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'
import ImpresionVolteoEstadoBadge from './ImpresionVolteoEstadoBadge'

const entradasCopy = copy.tintas.entradas
const ladoCopy = copy.tintas.lado
const volteoCopy = copy.tintas.tintasVolteo
const millaresCopy = copy.tintas.millaresCalculados

const TABLE_COL_COUNT = 10

interface ImpresionTintasEntradasListProps {
  rows: ImpresionTintasTableRow[]
  activeColorPlanchaId: string
  editingEntradaId: string | null
  onEdit: (colorPlanchaId: string, entradaId: string) => void
  onRemove: (colorPlanchaId: string, entradaId: string) => void
}

const formatPrecio = (value: number) =>
  value > 0 ? formatPrecioMillar(value) : entradasCopy.millaresEmpty

const formatLadoGrupoInkNames = (inkIndices: number[]): string[] =>
  inkIndices.map(index => {
    const normalized = normalizeImpresionInkIndex(index)
    return isValidImpresionTintaIndex(normalized)
      ? DISENO_INK_PALETTE[normalized]!.name
      : ladoCopy.slotSinAsignar
  })

const ImpresionLadoGrupoInkBlock: React.FC<{
  variant: ImpresionTintasGrupoVariant
  grupoLabel: string
  inkIndices: number[]
}> = ({ variant, grupoLabel, inkIndices }) => {
  if (inkIndices.length === 0) {
    return (
      <div
        className={clsx(
          'production-impresion-tintas-lado-grupo',
          'production-impresion-tintas-lado-grupo--empty',
          `production-impresion-tintas-lado-grupo--${variant}`
        )}
      >
        <span className="production-impresion-tintas-lado-grupo__label">{grupoLabel}</span>
        <span className="production-plancha-table__muted">{entradasCopy.millaresEmpty}</span>
      </div>
    )
  }

  const names = formatLadoGrupoInkNames(inkIndices)

  return (
    <div
      className={clsx('production-impresion-tintas-lado-grupo', `production-impresion-tintas-lado-grupo--${variant}`)}
      title={`${grupoLabel}: ${names.join(', ')}`}
    >
      <div className="production-impresion-tintas-lado-grupo__head">
        <span className="production-impresion-tintas-lado-grupo__label">{grupoLabel}</span>
        <span className="production-impresion-tintas-lado-grupo__count">
          {entradasCopy.tintasCountLabel(inkIndices.length)}
        </span>
      </div>
      <span className="production-colores-icons production-colores-icons--sm">
        {inkIndices.map((inkIndex, index) => {
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

const ImpresionLadoGruposTableCell: React.FC<{ lado: ImpresionLadoTintas }> = ({ lado }) => {
  if (lado.cantidad <= 0) {
    return <span className="production-plancha-table__muted">{entradasCopy.ladoSinTintas}</span>
  }

  return (
    <div className="production-impresion-tintas-lado-grupos-cell">
      <ImpresionLadoGrupoInkBlock
        variant="colorBasico"
        grupoLabel={volteoCopy.badgeColorBasico}
        inkIndices={filterLadoInkIndicesByGrupo(lado, 'colorBasico')}
      />
      <ImpresionLadoGrupoInkBlock
        variant="pantone"
        grupoLabel={volteoCopy.badgePantone}
        inkIndices={filterLadoInkIndicesByGrupo(lado, 'pantone')}
      />
    </div>
  )
}

const TintasGrupoTableCell: React.FC<{
  variant: ImpresionTintasGrupoVariant
  tintasTiro: number
  tintasRetiro: number
  millares: number
  precio: number
  conVolteo?: boolean
}> = ({ variant, tintasTiro, tintasRetiro, millares, precio, conVolteo }) => {
  const tintasTotal = tintasTiro + tintasRetiro

  return (
    <div
      className={clsx(
        'production-impresion-tintas-grupo-cell',
        'production-impresion-tintas-grupo-cell--table',
        `production-impresion-tintas-grupo-cell--${variant}`
      )}
    >
      <div className="production-impresion-tintas-grupo-cell__head">
        <span className="production-impresion-tintas-grupo-cell__count">
          {tintasTotal > 0 ? entradasCopy.tintasCountLabel(tintasTotal) : entradasCopy.millaresEmpty}
        </span>
        {tintasTotal > 0 && conVolteo !== undefined ? (
          <ImpresionVolteoEstadoBadge conVolteo={conVolteo} />
        ) : null}
      </div>
      <span className="production-impresion-tintas-grupo-cell__lados">
        {ladoCopy.tiro}: {entradasCopy.tintasCountLabel(tintasTiro)} · {ladoCopy.retiro}:{' '}
        {entradasCopy.tintasCountLabel(tintasRetiro)}
      </span>
      {tintasTotal > 0 ? (
        <>
          <span className="production-impresion-tintas-grupo-cell__millares">
            {entradasCopy.millaresValueLabel}: {formatMillaresFactor(millares)}
          </span>
          <span className="production-impresion-tintas-grupo-cell__precio">
            {millaresCopy.valorImpresionLabel}: {formatPrecio(precio)}
          </span>
        </>
      ) : null}
    </div>
  )
}

const PrecioTintaCell: React.FC<{ millares: number; value: number }> = ({ millares, value }) => (
  <div className="production-impresion-tintas-precio-cell production-impresion-tintas-precio-cell--stack">
    <span className="production-impresion-tintas-precio-cell__millares">
      {entradasCopy.millaresValueLabel}: {formatMillaresFactor(millares)}
    </span>
    <span className="production-impresion-tintas-precio-cell__valor">{formatPrecio(value)}</span>
  </div>
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
                {entradasCopy.registroTotalLabel}
              </th>
              <th scope="col" className="production-plancha-table__th production-plancha-table__th--act">
                <span className="sr-only">{entradasCopy.tableAcciones}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="production-plancha-table__row production-plancha-table__row--empty">
                <td colSpan={TABLE_COL_COUNT} className="production-plancha-table__td production-impresion-tintas-table__empty">
                  <strong>{entradasCopy.emptyTitle}</strong>
                  <span>{entradasCopy.emptyGlobal}</span>
                </td>
              </tr>
            ) : (
              rows.map(({ colorPlanchaId, plancha, registro, entrada, maxColoresPlancha }) => {
                const resumen = resolveEntradaRegistroResumen(entrada)
                const total = sumImpresionEntradaTintas(entrada)
                const isEditing = editingEntradaId === entrada.id
                const isActivePlancha = colorPlanchaId === activeColorPlanchaId
                const conVolteoColorBasico = resolveRegistroConVolteoColorBasico(registro)
                const conVolteoPantone = resolveRegistroConVolteoPantone(registro)
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
                    <td className="production-plancha-table__td production-plancha-table__td--num">
                      <TintasGrupoTableCell
                        variant="colorBasico"
                        tintasTiro={countLadoInkIndicesByGrupo(entrada.tiro, 'colorBasico')}
                        tintasRetiro={countLadoInkIndicesByGrupo(entrada.retiro, 'colorBasico')}
                        millares={resumen.millaresColorBasico}
                        precio={resumen.precioTintaColorBasico}
                        conVolteo={conVolteoColorBasico}
                      />
                    </td>
                    <td className="production-plancha-table__td production-plancha-table__td--num">
                      <TintasGrupoTableCell
                        variant="pantone"
                        tintasTiro={countLadoInkIndicesByGrupo(entrada.tiro, 'pantone')}
                        tintasRetiro={countLadoInkIndicesByGrupo(entrada.retiro, 'pantone')}
                        millares={resumen.millaresPantone}
                        precio={resumen.precioTintaPantone}
                        conVolteo={conVolteoPantone}
                      />
                    </td>
                    <td className="production-plancha-table__td">
                      <ImpresionLadoGruposTableCell lado={entrada.tiro} />
                    </td>
                    <td className="production-plancha-table__td">
                      <ImpresionLadoGruposTableCell lado={entrada.retiro} />
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
                      <PrecioTintaCell millares={resumen.millaresColorBasico} value={resumen.precioTintaColorBasico} />
                    </td>
                    <td className="production-plancha-table__td production-plancha-table__td--num">
                      <PrecioTintaCell millares={resumen.millaresPantone} value={resumen.precioTintaPantone} />
                    </td>
                    <td className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total">
                      <span className="production-impresion-tintas-total-cell production-impresion-tintas-total-cell--precio">
                        {formatPrecio(resumen.grandTotal)}
                      </span>
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
