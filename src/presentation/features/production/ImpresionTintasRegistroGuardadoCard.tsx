import React from 'react'
import clsx from 'clsx'
import type { ImpresionTiroRetiroEntrada } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import ActionIcon from '../../components/ui/ActionIcon'
import { LIST_RECORD_ACTION_ICON_SIZE } from '../../constants/listRecordActions'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  formatMillaresFactor,
  resolveEntradaRegistroResumen,
} from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar } from './utils/impresionVolteoTarifaUtils'
import { sumImpresionEntradaTintas } from './utils/impresionTintasUtils'

const entradasCopy = copy.tintas.entradas

interface ImpresionTintasRegistroGuardadoCardProps {
  plancha: DisenoColorPlanchaItem
  entrada: ImpresionTiroRetiroEntrada
  maxColoresPlancha: number
  isEditing: boolean
  onEdit: () => void
  onRemove: () => void
}

const ImpresionTintasRegistroGuardadoCard: React.FC<ImpresionTintasRegistroGuardadoCardProps> = ({
  plancha,
  entrada,
  maxColoresPlancha,
  isEditing,
  onEdit,
  onRemove,
}) => {
  const resumen = resolveEntradaRegistroResumen(entrada)
  const total = sumImpresionEntradaTintas(entrada)
  const planchaLabel = [
    plancha.planchaNombreMedida,
    plancha.detalle?.trim() ? plancha.detalle.trim() : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const iconSize = LIST_RECORD_ACTION_ICON_SIZE

  return (
    <article
      className={clsx(
        'production-impresion-tintas-registro-card',
        isEditing && 'production-impresion-tintas-registro-card--editing'
      )}
    >
      <div className="production-impresion-tintas-registro-card__toolbar">
        <div className="production-impresion-tintas-registro-card__head">
          <strong className="production-impresion-tintas-registro-card__title">{planchaLabel}</strong>
          <span className="production-impresion-tintas-registro-card__estado">
            {isEditing ? entradasCopy.editing : entradasCopy.listTitle}
          </span>
        </div>
        <div className="production-impresion-tintas-registro-card__actions">
          <button
            type="button"
            className={clsx(
              'action-icon-button action-icon-edit production-impresion-tintas-registro-card__edit',
              isEditing && 'production-impresion-tintas-registro-card__edit--active'
            )}
            onClick={onEdit}
            title={isEditing ? entradasCopy.editing : entradasCopy.edit}
            aria-label={isEditing ? entradasCopy.editing : entradasCopy.edit}
            aria-pressed={isEditing}
          >
            <ActionIcon name="edit" size={iconSize} />
          </button>
          <button
            type="button"
            className="action-icon-button action-icon-delete production-impresion-tintas-registro-card__remove"
            onClick={onRemove}
            title={entradasCopy.remove}
            aria-label={entradasCopy.remove}
          >
            <ActionIcon name="delete" size={iconSize} />
          </button>
        </div>
      </div>

      <dl className="production-impresion-tintas-registro-card__metrics">
        <div>
          <dt>{entradasCopy.tableTotal}</dt>
          <dd>{entradasCopy.totalValores(entrada.tiro.cantidad, entrada.retiro.cantidad)}</dd>
        </div>
        <div>
          <dt>{entradasCopy.millaresValueLabel}</dt>
          <dd>{formatMillaresFactor(resumen.millaresColorBasico + resumen.millaresPantone)}</dd>
        </div>
        <div>
          <dt>{entradasCopy.tablePrecioColorBasico}</dt>
          <dd>{resumen.precioTintaColorBasico > 0 ? formatPrecioMillar(resumen.precioTintaColorBasico) : entradasCopy.millaresEmpty}</dd>
        </div>
        <div>
          <dt>{entradasCopy.tablePrecioPantone}</dt>
          <dd>{resumen.precioTintaPantone > 0 ? formatPrecioMillar(resumen.precioTintaPantone) : entradasCopy.millaresEmpty}</dd>
        </div>
        <div>
          <dt>{entradasCopy.tablePrecioVolteo}</dt>
          <dd>{resumen.precioVolteo > 0 ? formatPrecioMillar(resumen.precioVolteo) : entradasCopy.millaresEmpty}</dd>
        </div>
      </dl>
      <p className="production-plancha-draft__field-hint">
        {entradasCopy.totalTintas(total, maxColoresPlancha)}
      </p>
    </article>
  )
}

export default ImpresionTintasRegistroGuardadoCard
