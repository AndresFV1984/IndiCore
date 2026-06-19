import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionOrdenResumenSection from './ProductionOrdenResumenSection'
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
        key: 'tipo-papel',
        label: 'Tipo de papel',
        value: clienteSuministra
          ? copy.suministro.opciones.cliente.title
          : row.type?.trim() || copy.resumen.empty,
        inactive: !clienteSuministra && !row.tipoPapelId,
      },
      {
        key: 'despiece',
        label: 'Despiece por pliego',
        value: row.despiece
          ? despiecePliegoSelectOptionLabel(row.despiece)
          : copy.resumen.empty,
        inactive: !row.despiece,
      },
      {
        key: 'valor-hoja',
        label: 'Valor hoja (catálogo)',
        value:
          row.valorHoja && row.valorHoja > 0
            ? formatValorHojaDisplay(row.valorHoja)
            : copy.resumen.empty,
        inactive: !row.tipoPapelId,
      },
      {
        key: 'cantidad-hojas',
        label: 'Cantidad hojas',
        value: cantidadHojas > 0 ? cantidadHojas.toLocaleString('es-CO') : copy.resumen.empty,
        inactive: cantidadHojas <= 0,
      },
      {
        key: 'valor-papel',
        label: copy.resumen.valorPapelLabel,
        value: clienteSuministra
          ? copy.resumen.valorPapelClienteSuministra
          : valorPapel > 0
            ? formatValor(valorPapel)
            : copy.resumen.empty,
        inactive: !clienteSuministra && valorPapel <= 0,
        valueTitle: clienteSuministra ? undefined : copy.resumen.valorPapelHint,
      },
      {
        key: 'valor-corte',
        label: copy.resumen.valorCorte,
        value: valorCorte > 0 ? formatValor(valorCorte) : copy.resumen.empty,
        inactive: valorCorte <= 0,
      },
    ],
    [row, cantidadHojas, valorPapel, valorCorte, clienteSuministra]
  )

  const totalCobro = (clienteSuministra ? 0 : valorPapel) + valorCorte

  return (
    <ProductionOrdenResumenSection
      className="production-corte-resumen"
      rows={filas}
      totalLabel={copy.resumen.total}
      totalValue={totalCobro > 0 ? formatValor(totalCobro) : copy.resumen.empty}
      totalHint={copy.resumen.totalHint}
      subtitle={
        registroLabel
          ? `${copy.resumen.subtitle} · ${registroLabel}`
          : copy.resumen.subtitle
      }
    />
  )
}

export default ProductionCorteResumen
