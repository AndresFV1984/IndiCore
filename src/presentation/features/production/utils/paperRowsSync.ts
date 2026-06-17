import type { PaperRow } from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../../core/domain/entities/TipoPapel'
import { getColoresOptionMeta, resolveColoresPlanchaForRow } from './coloresPlanchasUtils'
import {
  computeCortePapelValores,
  deriveValorCorteFromCantidades,
  isClienteSuministraPapel,
  isPapelSinCortar,
  isPapelSinCortarClienteSuministro,
} from './cortePapelCalculations'
import { CORTE_PAPEL_COPY as copy } from '../constants/cortePapelCopy'
import {
  findFaltanteRowForParent,
  isFaltanteLitografiaRow,
  listAllCortePaperRows,
  listFaltantePaperRows,
  syncPreprensaPaperRows,
} from './cortePapelFaltante'
import { emptyPaperRow } from './tipoPapelDisplay'

/** Tipo plancha + descripción (select y textos compactos). */
export const formatColoresPlanchaRegistroSelectLabel = (item: DisenoColorPlanchaItem): string => {
  const tipoPlancha =
    item.planchaNombreMedida?.trim() || getColoresOptionMeta(item.colores).label
  const descripcion = item.detalle?.trim() || 'Sin descripción'
  return `${tipoPlancha} · ${descripcion}`
}

/** Etiqueta con número de registro (resumen, banner). */
export const formatColoresPlanchaRegistroLabel = (
  item: DisenoColorPlanchaItem,
  index: number
): string => `Registro ${index + 1} — ${formatColoresPlanchaRegistroSelectLabel(item)}`

/** Una línea resumida para listas compactas del resumen de corte. */
export const formatCorteResumenLineaCompacta = (
  line: Pick<
    CorteRegistroResumenLine,
    'tipoPapel' | 'cantidadHojas' | 'valorCorte' | 'valorPapel' | 'completo'
  >,
  clienteSuministra: boolean
): string => {
  if (!line.completo) return 'Sin configurar'
  const parts: string[] = []
  if (line.tipoPapel.trim()) parts.push(line.tipoPapel.trim())
  if (line.cantidadHojas > 0) {
    parts.push(`${line.cantidadHojas.toLocaleString('es-CO')} hojas`)
  }
  if (!clienteSuministra && line.valorPapel > 0) {
    parts.push(
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(line.valorPapel)
    )
  }
  if (line.valorCorte > 0) {
    parts.push(
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(line.valorCorte)
    )
  }
  return parts.length > 0 ? parts.join(' · ') : '—'
}

/** Filas preprensa sincronizadas más faltantes litografía vinculados. */
export const syncPaperRowsWithColoresPlanchas = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[]
): PaperRow[] => {
  if (coloresPlanchas.length === 0) return listFaltantePaperRows(paperRows)

  const base = syncPreprensaPaperRows(coloresPlanchas, paperRows)
  const faltantes = listFaltantePaperRows(paperRows).filter(
    row =>
      row.faltanteDeColorPlanchaId &&
      coloresPlanchas.some(item => item.id === row.faltanteDeColorPlanchaId)
  )
  return [...base, ...faltantes]
}

export const findPaperRowForRegistro = (
  paperRows: PaperRow[],
  colorPlanchaId: string
): PaperRow =>
  paperRows.find(row => row.colorPlanchaId === colorPlanchaId) ?? {
    ...emptyPaperRow(),
    colorPlanchaId,
  }

export const upsertPaperRowForRegistro = (
  paperRows: PaperRow[],
  row: PaperRow
): PaperRow[] => {
  const registroId = row.colorPlanchaId
  if (!registroId) return paperRows.length > 0 ? paperRows : [row]

  const next = [...paperRows]
  const index = next.findIndex(r => r.colorPlanchaId === registroId)
  const normalized = { ...row, colorPlanchaId: registroId }
  if (index >= 0) {
    next[index] = normalized
    return next
  }
  next.push(normalized)
  return next
}

export interface OrderCortePapelMetrics {
  cantidadHojas: number
  valorPapel: number
  valorCorte: number
}

export interface CorteRegistroResumenLine {
  colorPlanchaId: string
  corteRowId?: string
  esFaltanteLitografia?: boolean
  label: string
  /** Sin prefijo «Registro N —» (listas compactas). */
  shortLabel: string
  /** Registro preprensa del cliente al que pertenece un faltante de litografía. */
  parentLabel?: string
  parentColorPlanchaId?: string
  tipoPapel: string
  piezasPorPliego: number
  valorCorteUnitario: number
  valorHoja: number
  cantidadHojas: number
  /** Hojas descontadas por faltante litografía (solo registro padre). */
  hojasFaltanteRestadas?: number
  valorPapel: number
  valorCorte: number
  papelSinCortar: boolean
  estadoPapelLabel: string
  tamanosBuenos: number
  sobrante: number
  /** Datos del corte de papel completados para este registro. */
  completo: boolean
}

/** Registro con tipo de papel, despiece y cantidades listas para corte. */
export const isCorteRegistroCompleto = (
  row: PaperRow,
  coloresPlanchas: DisenoColorPlanchaItem[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice
): boolean => {
  if (!row.tipoPapelId?.trim() || !row.despiece?.despieceId) return false

  const piezasPorPliego = row.despiece?.piezasPorPliego ?? 0
  if (piezasPorPliego <= 0) return false

  if (isFaltanteLitografiaRow(row)) {
    if ((row.hojasFaltanteCantidad ?? 0) <= 0) return false
    const parentItem = coloresPlanchas.find(c => c.id === row.faltanteDeColorPlanchaId)
    const tipo = tiposPapel.find(t => t.id === row.tipoPapelId) ?? null
    const valores = computeCortePapelValores({
      coloresPlanchas: parentItem ? [parentItem] : [],
      row,
      tipoPapel: tipo,
      margenRedondeo,
      clienteSuministraPapel,
    })
    return valores.cantidadHojas > 0
  }

  const item = coloresPlanchas.find(c => c.id === row.colorPlanchaId)
  if (!item) return false

  if (isClienteSuministraPapel(clienteSuministraPapel)) {
    if ((row.hojasEntregadasCliente ?? 0) <= 0) return false
    if ((row.tamanosBuenosManual ?? 0) <= 0) return false
  }

  const tipo = tiposPapel.find(t => t.id === row.tipoPapelId) ?? null
  const valores = computeCortePapelValores({
    coloresPlanchas: [item],
    row,
    tipoPapel: tipo,
    margenRedondeo,
    clienteSuministraPapel,
  })

  return valores.cantidadHojas > 0
}

export const resolveEstadoPapelResumenLabel = (row: PaperRow): string =>
  isPapelSinCortar(row)
    ? copy.resumen.registroEstadoSinCortar
    : copy.resumen.registroEstadoCortado

const resolveCantidadHojasResumen = (
  row: PaperRow,
  paperRows: PaperRow[],
  cantidadCalculada: number,
  valorCorte: number,
  unidadEmpaqueCantidad: number,
  valorCorteUnitario: number,
  margenRedondeo: number
): { cantidadHojas: number; valorCorte: number; hojasFaltanteRestadas: number } => {
  if (isFaltanteLitografiaRow(row)) {
    return { cantidadHojas: cantidadCalculada, valorCorte, hojasFaltanteRestadas: 0 }
  }

  const parentId = row.colorPlanchaId
  if (!parentId) {
    return { cantidadHojas: cantidadCalculada, valorCorte, hojasFaltanteRestadas: 0 }
  }

  const faltanteHojas =
    findFaltanteRowForParent(paperRows, parentId)?.hojasFaltanteCantidad ?? 0
  if (faltanteHojas <= 0) {
    return { cantidadHojas: cantidadCalculada, valorCorte, hojasFaltanteRestadas: 0 }
  }

  const cantidadHojas = Math.max(0, cantidadCalculada - faltanteHojas)
  const valorCorteAjustado =
    valorCorte > 0 && cantidadHojas !== cantidadCalculada
      ? deriveValorCorteFromCantidades(
          cantidadHojas,
          unidadEmpaqueCantidad,
          valorCorteUnitario,
          margenRedondeo
        )
      : valorCorte

  return { cantidadHojas, valorCorte: valorCorteAjustado, hojasFaltanteRestadas: faltanteHojas }
}

export interface CorteResumenConsolidado {
  registros: CorteRegistroResumenLine[]
  totales: OrderCortePapelMetrics
}

export const buildCorteResumenConsolidado = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice
): CorteResumenConsolidado => {
  const allRows = listAllCortePaperRows(coloresPlanchas, paperRows)
  const registros = allRows.map((row, index) => {
    const esFaltante = isFaltanteLitografiaRow(row)
    const item = coloresPlanchas.find(c => c.id === row.colorPlanchaId)
    const parentItem = esFaltante
      ? coloresPlanchas.find(c => c.id === row.faltanteDeColorPlanchaId)
      : item
    const scope = esFaltante && parentItem ? [parentItem] : item ? [item] : []
    const tipo = row.tipoPapelId ? tiposPapel.find(t => t.id === row.tipoPapelId) ?? null : null
    const valores = computeCortePapelValores({
      coloresPlanchas: scope,
      row,
      tipoPapel: tipo,
      margenRedondeo,
      clienteSuministraPapel,
    })
    const sinCortar =
      esFaltante || isPapelSinCortarClienteSuministro(clienteSuministraPapel, row)
    const manualCliente =
      esFaltante || (isClienteSuministraPapel(clienteSuministraPapel) && !esFaltante)
    const baseLabel = parentItem
      ? formatColoresPlanchaRegistroSelectLabel(parentItem)
      : `Registro ${index + 1}`
    const cantidadResumen = resolveCantidadHojasResumen(
      row,
      paperRows,
      valores.cantidadHojas,
      valores.valorCorte,
      valores.unidadEmpaqueCantidad,
      valores.valorCorteUnitario,
      valores.margenRedondeo
    )
    return {
      colorPlanchaId: row.colorPlanchaId ?? row.faltanteDeColorPlanchaId ?? '',
      corteRowId: row.corteRowId,
      esFaltanteLitografia: esFaltante,
      label: esFaltante
        ? copy.resumen.registroFaltanteLitografia
        : item
          ? formatColoresPlanchaRegistroLabel(item, index)
          : `Registro ${index + 1}`,
      shortLabel: esFaltante ? copy.faltante.registroMarca : item
          ? formatColoresPlanchaRegistroSelectLabel(item)
          : `Registro ${index + 1}`,
      parentLabel: esFaltante && parentItem ? baseLabel : undefined,
      parentColorPlanchaId: esFaltante ? row.faltanteDeColorPlanchaId : undefined,
      tipoPapel: row.type?.trim() || tipo?.name?.trim() || '',
      piezasPorPliego: row.despiece?.piezasPorPliego ?? 0,
      valorCorteUnitario: valores.valorCorteUnitario,
      valorHoja: valores.valorHoja,
      cantidadHojas: cantidadResumen.cantidadHojas,
      hojasFaltanteRestadas: cantidadResumen.hojasFaltanteRestadas,
      valorPapel: valores.valorPapel,
      valorCorte: cantidadResumen.valorCorte,
      papelSinCortar: sinCortar,
      estadoPapelLabel: resolveEstadoPapelResumenLabel(row),
      tamanosBuenos: manualCliente
        ? row.tamanosBuenosManual ?? 0
        : item?.tamanosBuenos ?? 0,
      sobrante: manualCliente ? row.sobranteManual ?? 0 : item?.sobrante ?? 0,
      completo: isCorteRegistroCompleto(
        row,
        coloresPlanchas,
        tiposPapel,
        margenRedondeo,
        clienteSuministraPapel
      ),
    }
  })

  const totales = registros.reduce<OrderCortePapelMetrics>(
    (acc, line) => ({
      cantidadHojas: acc.cantidadHojas + line.cantidadHojas,
      valorPapel: acc.valorPapel + line.valorPapel,
      valorCorte: acc.valorCorte + line.valorCorte,
    }),
    { cantidadHojas: 0, valorPapel: 0, valorCorte: 0 }
  )

  return { registros, totales }
}

export const resolveOrderCortePapelMetrics = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice
): OrderCortePapelMetrics =>
  buildCorteResumenConsolidado(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  ).totales

export const paperRowsMatchColoresPlanchas = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[]
): boolean => {
  if (coloresPlanchas.length === 0) return paperRows.every(isFaltanteLitografiaRow)
  const base = syncPreprensaPaperRows(coloresPlanchas, paperRows)
  if (base.length !== coloresPlanchas.length) return false
  return base.every((row, i) => row.colorPlanchaId === coloresPlanchas[i]?.id)
}
