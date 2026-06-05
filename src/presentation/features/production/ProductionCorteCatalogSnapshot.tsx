import React from 'react'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { DespieceAsociado } from '../../../core/domain/entities/CortePapel'
import { formatUnidadEmpaqueDisplay } from '../../../core/domain/value-objects/UnidadEmpaque'
import { formatMedidaDisplayFrom, formatDespieceMedidaPiezas } from '../catalog/cortePapelUtils'
import { formatPiezasPorPliegoDisplay } from './utils/cortePapelDisplay'
import { formatValorHojaDisplay } from './utils/tipoPapelDisplay'

interface SnapshotItem {
  label: string
  value: string
}

const SnapshotGroup: React.FC<{ title: string; items: SnapshotItem[] }> = ({ title, items }) => (
  <div className="production-corte-snapshot__group">
    <p className="production-corte-snapshot__group-title">{title}</p>
    <dl className="production-corte-snapshot__list">
      {items.map(item => (
        <div key={item.label} className="production-corte-snapshot__item">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  </div>
)

interface ProductionCorteCatalogSnapshotProps {
  tipoPapel: TipoPapel
  despiece: DespieceAsociado | null
  /** Sin marco ni fondo; para incrustar en el panel del formulario */
  inline?: boolean
}

const ProductionCorteCatalogSnapshot: React.FC<ProductionCorteCatalogSnapshotProps> = ({
  tipoPapel,
  despiece,
  inline = false,
}) => {
  const papelItems: SnapshotItem[] = [
    { label: 'Nombre', value: tipoPapel.name },
    { label: 'Medida', value: formatMedidaDisplayFrom(tipoPapel) },
    { label: 'Valor hoja', value: formatValorHojaDisplay(tipoPapel.valorHoja) },
    {
      label: 'Unidad empaque',
      value: formatUnidadEmpaqueDisplay(tipoPapel.unidadEmpaque),
    },
  ]

  const despieceItems: SnapshotItem[] = despiece
    ? [
        { label: 'Despiece', value: despiece.name?.trim() || '—' },
        { label: 'Medida', value: formatDespieceMedidaPiezas(despiece) },
        {
          label: 'Piezas / pliego',
          value: formatPiezasPorPliegoDisplay(despiece.piezasPorPliego),
        },
        {
          label: 'Valor corte',
          value:
            typeof despiece.valorCorte === 'number' && despiece.valorCorte > 0
              ? formatValorHojaDisplay(despiece.valorCorte)
              : '—',
        },
      ]
    : []

  return (
    <div
      className={[
        'production-corte-snapshot',
        inline ? 'production-corte-snapshot--inline' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Datos del catálogo"
    >
      <SnapshotGroup title="Tipo de papel" items={papelItems} />
      {despiece ? (
        <SnapshotGroup title="Despiece seleccionado" items={despieceItems} />
      ) : (
        <p className="production-corte-snapshot__pending">
          Seleccione un despiece por pliego para ver su valor corte y calcular el total.
        </p>
      )}
    </div>
  )
}

export default ProductionCorteCatalogSnapshot
