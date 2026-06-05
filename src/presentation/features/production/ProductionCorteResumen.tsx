import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import { formatValorHojaDisplay, despiecePliegoSelectOptionLabel } from './utils/tipoPapelDisplay'

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

interface ProductionCorteResumenProps {
  row: PaperRow
  cantidadHojas: number
  valorPapel: number
  valorCorte: number
  clienteSuministraPapel?: YesNoChoice
  registroLabel?: string
}

const ProductionCorteResumen: React.FC<ProductionCorteResumenProps> = ({
  row,
  cantidadHojas,
  valorPapel,
  valorCorte,
  clienteSuministraPapel = 'no',
  registroLabel,
}) => {
  const clienteSuministra = clienteSuministraPapel === 'si'

  const filas = useMemo(
    () => [
      {
        label: 'Tipo de papel',
        value: clienteSuministra
          ? copy.suministro.opciones.cliente.title
          : row.type?.trim() || copy.resumen.empty,
        inactive: !clienteSuministra && !row.tipoPapelId,
      },
      {
        label: 'Despiece por pliego',
        value: row.despiece
          ? despiecePliegoSelectOptionLabel(row.despiece)
          : copy.resumen.empty,
        inactive: !row.despiece,
      },
      {
        label: 'Valor hoja (catálogo)',
        value:
          row.valorHoja && row.valorHoja > 0
            ? formatValorHojaDisplay(row.valorHoja)
            : copy.resumen.empty,
        inactive: !row.tipoPapelId,
      },
      {
        label: 'Cantidad hojas',
        value: cantidadHojas > 0 ? cantidadHojas.toLocaleString('es-CO') : copy.resumen.empty,
        inactive: cantidadHojas <= 0,
      },
      {
        label: copy.resumen.valorPapelLabel,
        value: clienteSuministra
          ? copy.resumen.valorPapelClienteSuministra
          : valorPapel > 0
            ? formatValor(valorPapel)
            : copy.resumen.empty,
        inactive: !clienteSuministra && valorPapel <= 0,
        hint: clienteSuministra ? undefined : copy.resumen.valorPapelHint,
      },
    ],
    [row, cantidadHojas, valorPapel, clienteSuministra]
  )

  return (
    <ProductionWorkspaceSection
      className="production-diseno-resumen"
      tag={copy.sectionTags.resumen}
      title={copy.resumen.title}
      subtitle={
        registroLabel
          ? `${copy.resumen.subtitle} · ${registroLabel}`
          : copy.resumen.subtitle
      }
      tone={0}
    >
      <ul className="production-diseno-resumen__rows">
        {filas.map(rowItem => (
          <li
            key={rowItem.label}
            className={[
              'production-diseno-resumen__row',
              rowItem.inactive ? 'production-diseno-resumen__row--inactive' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="production-diseno-resumen__row-label">{rowItem.label}</span>
            <span
              className="production-diseno-resumen__row-value"
              title={'hint' in rowItem ? rowItem.hint : undefined}
            >
              {rowItem.value}
            </span>
          </li>
        ))}
      </ul>
      <div className="production-diseno-resumen__total" aria-live="polite">
        <div className="production-diseno-resumen__total-info">
          <span className="production-diseno-resumen__total-label">{copy.resumen.totalLabel}</span>
          <span className="production-diseno-resumen__total-hint">{copy.resumen.totalHint}</span>
        </div>
        <strong className="production-diseno-resumen__total-value">
          {valorCorte > 0 ? formatValor(valorCorte) : copy.resumen.empty}
        </strong>
      </div>
    </ProductionWorkspaceSection>
  )
}

export default ProductionCorteResumen
