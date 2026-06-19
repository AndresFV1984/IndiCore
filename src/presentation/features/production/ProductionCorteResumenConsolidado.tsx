import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import ProductionOrdenResumenSection from './ProductionOrdenResumenSection'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import { buildCorteResumenConsolidado } from './utils/paperRowsSync'
import { formatValorHojaDisplay } from './utils/tipoPapelDisplay'

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const fmtMoney = (value: number): string =>
  value > 0 ? formatValorHojaDisplay(value) : copy.resumen.empty

interface ProductionCorteResumenConsolidadoProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  paperRows: PaperRow[]
  tiposPapel: TipoPapel[]
  margenRedondeo: number
  clienteSuministraPapel: YesNoChoice
}

const ProductionCorteResumenConsolidado: React.FC<ProductionCorteResumenConsolidadoProps> = ({
  coloresPlanchas,
  paperRows,
  tiposPapel,
  margenRedondeo,
  clienteSuministraPapel,
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
          valorPapel: acc.valorPapel + line.valorPapel,
          valorCorte: acc.valorCorte + line.valorCorte,
        }),
        { valorPapel: 0, valorCorte: 0 }
      ),
    [registrosCompletados]
  )

  if (registrosCompletados.length === 0) return null

  const totalConsolidado = totalesCompletados.valorPapel + totalesCompletados.valorCorte

  return (
    <ProductionOrdenResumenSection
      className="production-corte-resumen-consolidado"
      rows={[
        {
          key: 'valor-papel',
          label: copy.resumen.totalValorPapel,
          value: fmtMoney(totalesCompletados.valorPapel),
          inactive: totalesCompletados.valorPapel <= 0,
        },
        {
          key: 'valor-corte',
          label: copy.resumen.valorCorte,
          value: fmtMoney(totalesCompletados.valorCorte),
          inactive: totalesCompletados.valorCorte <= 0,
        },
      ]}
      totalLabel={copy.resumen.total}
      totalValue={totalConsolidado > 0 ? formatValor(totalConsolidado) : copy.resumen.empty}
      totalHint={copy.resumen.totalHintConsolidado}
      subtitle={copy.resumen.subtitleConsolidado}
    />
  )
}

export default ProductionCorteResumenConsolidado
