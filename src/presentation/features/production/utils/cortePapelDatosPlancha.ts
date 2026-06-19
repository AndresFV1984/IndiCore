import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from '../constants/cortePapelCopy'
import {
  computeTamanosBuenos,
  resolveColoresPlanchaForRow,
  resolveTamanosBuenosForItem,
  roundDivision,
  sumTamanosBuenosYSobrante,
} from './coloresPlanchasUtils'
import { isFaltanteLitografiaRow } from './cortePapelFaltante'
import {
  deriveCantidadHojasFromManualSuministro,
  usesManualCantidadClienteSuministro,
} from './cortePapelCalculations'
import { formatColoresPlanchaRegistroSelectLabel } from './paperRowsSync'

const datosCopy = copy.sections.datosPlancha

const fmt = (value: number) => value.toLocaleString('es-CO')

export type CortePapelDatosSource =
  | 'preprensa'
  | 'manual-cliente'
  | 'faltante-hojas'
  | 'manual-faltante'

export interface CortePapelDatosLinea {
  key: string
  label: string
  tamanosBuenos: number | null
  sobrante: number
  total: number
  formula?: string
}

export interface CortePapelDatosPlanchaViewModel {
  source: CortePapelDatosSource
  sourceHint: string
  lineas: CortePapelDatosLinea[]
  totalSuma: number
  piezasPorPliego: number
  cantidadHojasPreview: number | null
  emptyMessage?: string
  piezasPendiente: boolean
}

const buildFormulaForItem = (item: DisenoColorPlanchaItem, tamanosBuenos: number): string | undefined => {
  const result = computeTamanosBuenos(item.cantidad, item.numeroCavidades)
  if (!result.ok || tamanosBuenos <= 0) return undefined
  return datosCopy.formulaTamanosBuenos(
    fmt(item.cantidad),
    fmt(item.numeroCavidades),
    fmt(tamanosBuenos)
  )
}

export const buildCortePapelDatosPlancha = ({
  coloresPlanchas,
  row,
  clienteSuministraPapel = 'no',
}: {
  coloresPlanchas: DisenoColorPlanchaItem[]
  row: PaperRow
  clienteSuministraPapel?: YesNoChoice
}): CortePapelDatosPlanchaViewModel => {
  const piezasPorPliego = row.despiece?.piezasPorPliego ?? 0
  const resolvePreview = (totalSuma: number): number | null => {
    if (piezasPorPliego <= 0 || totalSuma <= 0) return null
    if (isFaltanteLitografiaRow(row) && (row.hojasFaltanteCantidad ?? 0) > 0) {
      return row.hojasFaltanteCantidad ?? null
    }
    if (usesManualCantidadClienteSuministro(clienteSuministraPapel) && !isFaltanteLitografiaRow(row)) {
      return deriveCantidadHojasFromManualSuministro(
        row.tamanosBuenosManual ?? 0,
        row.sobranteManual ?? 0,
        piezasPorPliego
      )
    }
    const items = resolveColoresPlanchaForRow(coloresPlanchas, row)
    if (items.length === 0) return null
    return roundDivision(totalSuma, piezasPorPliego)
  }

  if (isFaltanteLitografiaRow(row)) {
    const tamanosBuenosManual = row.tamanosBuenosManual ?? 0
    const sobranteManual = row.sobranteManual ?? 0
    if (tamanosBuenosManual > 0 || sobranteManual > 0) {
      const totalSuma = tamanosBuenosManual + sobranteManual
      return {
        source: 'manual-faltante',
        sourceHint: datosCopy.sourceManualFaltante,
        lineas: [
          {
            key: 'faltante-manual',
            label: copy.faltante.registroMarca,
            tamanosBuenos: tamanosBuenosManual,
            sobrante: sobranteManual,
            total: totalSuma,
          },
        ],
        totalSuma,
        piezasPorPliego,
        cantidadHojasPreview: resolvePreview(totalSuma),
        piezasPendiente: piezasPorPliego <= 0,
      }
    }

    const hojasFaltante = row.hojasFaltanteCantidad ?? 0
    return {
      source: 'faltante-hojas',
      sourceHint: datosCopy.sourceFaltanteHojas,
      lineas:
        hojasFaltante > 0
          ? [
              {
                key: 'faltante-hojas',
                label: copy.faltante.faltanteLabel,
                tamanosBuenos: null,
                sobrante: 0,
                total: hojasFaltante,
              },
            ]
          : [],
      totalSuma: hojasFaltante,
      piezasPorPliego,
      cantidadHojasPreview: hojasFaltante > 0 ? hojasFaltante : null,
      emptyMessage: hojasFaltante <= 0 ? datosCopy.emptyFaltante : undefined,
      piezasPendiente: false,
    }
  }

  if (usesManualCantidadClienteSuministro(clienteSuministraPapel)) {
    const tamanosBuenos = row.tamanosBuenosManual ?? 0
    const sobrante = row.sobranteManual ?? 0
    const totalSuma = tamanosBuenos + sobrante
    return {
      source: 'manual-cliente',
      sourceHint: datosCopy.sourceManualCliente,
      lineas:
        totalSuma > 0
          ? [
              {
                key: 'manual-cliente',
                label: copy.estadoCorte.panelTitle,
                tamanosBuenos,
                sobrante,
                total: totalSuma,
              },
            ]
          : [],
      totalSuma,
      piezasPorPliego,
      cantidadHojasPreview: resolvePreview(totalSuma),
      emptyMessage: totalSuma <= 0 ? datosCopy.emptyManual : undefined,
      piezasPendiente: piezasPorPliego <= 0,
    }
  }

  const items = resolveColoresPlanchaForRow(coloresPlanchas, row)
  const lineas = items.map(item => {
    const tamanosBuenos = resolveTamanosBuenosForItem(item)
    const sobrante = item.sobrante ?? 0
    return {
      key: item.id,
      label: formatColoresPlanchaRegistroSelectLabel(item),
      tamanosBuenos,
      sobrante,
      total: tamanosBuenos + sobrante,
      formula: buildFormulaForItem(item, tamanosBuenos),
    }
  })
  const totalSuma = sumTamanosBuenosYSobrante(items)

  return {
    source: 'preprensa',
    sourceHint: datosCopy.sourcePreprensa,
    lineas,
    totalSuma,
    piezasPorPliego,
    cantidadHojasPreview: resolvePreview(totalSuma),
    emptyMessage: lineas.length === 0 || totalSuma <= 0 ? datosCopy.emptyPreprensa : undefined,
    piezasPendiente: piezasPorPliego <= 0,
  }
}
