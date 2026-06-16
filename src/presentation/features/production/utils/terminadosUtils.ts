import { Money } from '../../../../core/domain/value-objects/Money'
import type {
  FinishItem,
  PaperRow,
  TerminadoProduccionLinea,
  TerminadoProduccionOrigen,
  TerminadosProduccionEntrada,
  TerminadosProduccionRegistro,
} from '../../../../core/domain/entities/Order'
import type { YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../../core/domain/entities/TipoPapel'
import type { CatalogRecord } from '../../catalog/catalogRecord'
import { parseCatalogNumeric, parseCatalogValorCmCuadrado } from '../../catalog/catalogRecord'
import { despieceAsociadoMedida } from '../../../../core/domain/entities/CortePapel'
import { listAllCortePaperRows } from './cortePapelFaltante'
import { buildCorteResumenConsolidado, isCorteRegistroCompleto } from './paperRowsSync'
import { computeTerminadoPrecio } from './terminadoPricingUtils'
import {
  emptyPaperRow,
  resolveDespieceForPaperRow,
  syncPaperRowWithTipoPapelCatalog,
} from './tipoPapelDisplay'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'

export const resolveTerminadosCorteRowKey = (row: PaperRow): string =>
  row.corteRowId ?? row.colorPlanchaId ?? ''

export interface TerminadosCorteContext {
  corteRowKey: string
  row: PaperRow
  label: string
  /** Sin prefijo «Registro N —» (tablas de asignados). */
  shortLabel: string
  tipoPapel: string
  despieceNombre: string
  despieceMedida: string
  tamanosBuenos: number
  completo: boolean
}

export const resolveTerminadosContextPlancha = (
  context: TerminadosCorteContext,
  coloresPlanchas: DisenoColorPlanchaItem[]
): DisenoColorPlanchaItem | null => {
  const direct = coloresPlanchas.find(item => item.id === context.row.colorPlanchaId)
  if (direct) return direct
  const parentId = context.row.faltanteDeColorPlanchaId
  if (!parentId) return null
  return coloresPlanchas.find(item => item.id === parentId) ?? null
}

export const buildTerminadosCorteContexts = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice
): TerminadosCorteContext[] => {
  const allRows = listAllCortePaperRows(coloresPlanchas, paperRows)
  const { registros } = buildCorteResumenConsolidado(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  )

  return registros.map((line, index) => {
    const syncedRow = syncPaperRowWithTipoPapelCatalog(allRows[index] ?? emptyPaperRow(), tiposPapel)
    const despiece = resolveDespieceForPaperRow(syncedRow, tiposPapel)

    return {
      corteRowKey: line.corteRowId ?? line.colorPlanchaId,
      row: despiece ? { ...syncedRow, despiece } : syncedRow,
      label: line.label,
      shortLabel: line.shortLabel,
      tipoPapel: line.tipoPapel,
      despieceNombre: despiece?.name?.trim() ?? '—',
      despieceMedida: despiece ? despieceAsociadoMedida(despiece) : '—',
      tamanosBuenos: line.tamanosBuenos,
      completo: line.completo,
    }
  })
}

export const createTerminadosProduccionEntrada = (
  lineas: TerminadoProduccionLinea[],
  id?: string
): TerminadosProduccionEntrada => ({
  id: id ?? crypto.randomUUID(),
  lineas,
})

export const resolveTerminadosEntradas = (
  registro: TerminadosProduccionRegistro
): TerminadosProduccionEntrada[] => {
  if (Array.isArray(registro.entradas)) return registro.entradas
  if (registro.lineas?.length) {
    return [createTerminadosProduccionEntrada(registro.lineas)]
  }
  return []
}

export const terminadosRegistroMatchesContext = (
  registro: TerminadosProduccionRegistro,
  context: TerminadosCorteContext
): boolean => {
  if (registro.corteRowKey === context.corteRowKey) return true

  const row = context.row
  const registroRowKey = registro.corteRowId ?? registro.corteRowKey
  const contextRowKey = row.corteRowId ?? row.colorPlanchaId ?? context.corteRowKey

  if (registroRowKey && contextRowKey && registroRowKey === contextRowKey) return true

  if (
    registro.colorPlanchaId &&
    row.colorPlanchaId &&
    registro.colorPlanchaId === row.colorPlanchaId &&
    context.corteRowKey === row.colorPlanchaId &&
    !registro.corteRowId &&
    !row.corteRowId
  ) {
    return true
  }

  return false
}

export const findTerminadosRegistroForContext = (
  registros: TerminadosProduccionRegistro[],
  context: TerminadosCorteContext
): TerminadosProduccionRegistro | null =>
  registros.find(registro => terminadosRegistroMatchesContext(registro, context)) ?? null

export const resolveTerminadosEntradasForContext = (
  registros: TerminadosProduccionRegistro[],
  context: TerminadosCorteContext
): TerminadosProduccionEntrada[] =>
  registros
    .filter(registro => terminadosRegistroMatchesContext(registro, context))
    .flatMap(registro => resolveTerminadosEntradas(registro))

export const patchTerminadosRegistroForContext = (
  registros: TerminadosProduccionRegistro[],
  context: TerminadosCorteContext,
  entradas: TerminadosProduccionEntrada[]
): TerminadosProduccionRegistro[] => {
  const withoutMatches = registros.filter(
    registro => !terminadosRegistroMatchesContext(registro, context)
  )
  if (entradas.length === 0) {
    return withoutMatches
  }
  const next: TerminadosProduccionRegistro = {
    corteRowKey: context.corteRowKey,
    colorPlanchaId: context.row.colorPlanchaId,
    corteRowId: context.row.corteRowId,
    entradas,
    completo: true,
  }
  return [...withoutMatches, next]
}

export const resolveEntradaTerminadosCount = (entrada: TerminadosProduccionEntrada): number =>
  entrada.lineas.length

export const resolveEntradaTerminadosTotal = (entrada: TerminadosProduccionEntrada): number =>
  entrada.lineas.reduce((sum, linea) => sum + linea.precioCobro, 0)

export const resolveEntradaTerminadosNombres = (entrada: TerminadosProduccionEntrada): string[] =>
  entrada.lineas.map(linea => linea.terminadoNombre.trim()).filter(Boolean)

export const formatEntradaTerminadosResumen = (entrada: TerminadosProduccionEntrada): string =>
  resolveEntradaTerminadosNombres(entrada).join(', ') || '—'

export const buildTerminadoProduccionLinea = (
  terminado: CatalogRecord,
  row: PaperRow,
  tamanosBuenos: number,
  origen: TerminadoProduccionOrigen = 'acceso-directo'
): TerminadoProduccionLinea => {
  const valorCmCuadrado = parseCatalogValorCmCuadrado(terminado.valorCmCuadrado)
  const costoMinimo = parseCatalogNumeric(terminado.cost)
  const ancho = row.despiece?.ancho ?? '0'
  const alto = row.despiece?.alto ?? '0'
  const pricing = computeTerminadoPrecio(ancho, alto, valorCmCuadrado, tamanosBuenos, costoMinimo)

  return {
    id: crypto.randomUUID(),
    terminadoId: terminado.id,
    terminadoNombre: terminado.name,
    valorCmCuadrado,
    costoMinimo,
    areaFactor: pricing.areaFactor,
    tamanosBuenos,
    precioCalculado: pricing.precioCalculado,
    precioCobro: pricing.precioCobro,
    origen,
  }
}

export const recalculateTerminadoLinea = (
  linea: TerminadoProduccionLinea,
  row: PaperRow,
  tamanosBuenos: number
): TerminadoProduccionLinea => {
  const ancho = row.despiece?.ancho ?? '0'
  const alto = row.despiece?.alto ?? '0'
  const pricing = computeTerminadoPrecio(
    ancho,
    alto,
    linea.valorCmCuadrado,
    tamanosBuenos,
    linea.costoMinimo
  )

  return {
    ...linea,
    areaFactor: pricing.areaFactor,
    tamanosBuenos,
    precioCalculado: pricing.precioCalculado,
    precioCobro: pricing.precioCobro,
  }
}

export const syncTerminadosRegistros = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice,
  registros: TerminadosProduccionRegistro[]
): TerminadosProduccionRegistro[] => {
  const contexts = buildTerminadosCorteContexts(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  )

  return contexts.flatMap(ctx => {
    const matching = registros.filter(registro =>
      terminadosRegistroMatchesContext(registro, ctx)
    )
    if (matching.length === 0) return []

    const entradas = matching
      .flatMap(registro => resolveTerminadosEntradas(registro))
      .map(entrada => ({
        ...entrada,
        lineas: entrada.lineas.map(linea =>
          recalculateTerminadoLinea(linea, ctx.row, ctx.tamanosBuenos)
        ),
      }))

    if (entradas.length === 0) return []

    return [
      {
        corteRowKey: ctx.corteRowKey,
        colorPlanchaId: ctx.row.colorPlanchaId,
        corteRowId: ctx.row.corteRowId,
        entradas,
        completo: true,
      },
    ]
  })
}

export const resolveTerminadosRegistroCompleto = (
  registro: TerminadosProduccionRegistro
): boolean => resolveTerminadosEntradas(registro).length > 0

export const resolveCompletedTerminadosCorteRowKeys = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  paperRows: PaperRow[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice,
  registros: TerminadosProduccionRegistro[]
): string[] => {
  const contexts = buildTerminadosCorteContexts(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  )
  return contexts
    .filter(
      ctx => ctx.completo && resolveTerminadosEntradasForContext(registros, ctx).length > 0
    )
    .map(ctx => ctx.corteRowKey)
}

export const patchTerminadosRegistro = (
  registros: TerminadosProduccionRegistro[],
  next: TerminadosProduccionRegistro
): TerminadosProduccionRegistro[] => {
  const entradas = resolveTerminadosEntradas(next)
  const index = registros.findIndex(item => item.corteRowKey === next.corteRowKey)
  if (entradas.length === 0) {
    if (index < 0) return registros
    const copy = [...registros]
    copy.splice(index, 1)
    return copy
  }
  if (index < 0) return [...registros, { ...next, entradas, completo: true }]
  const copy = [...registros]
  copy[index] = { ...next, entradas, completo: true }
  return copy
}

export const buildFinishesFromTerminadosRegistros = (
  registros: TerminadosProduccionRegistro[]
): FinishItem[] =>
  registros
    .filter(registro => resolveTerminadosRegistroCompleto(registro))
    .flatMap(registro =>
      resolveTerminadosEntradas(registro).flatMap(entrada =>
        entrada.lineas.map(linea => ({
          name: linea.terminadoNombre,
          quantity: 1,
          unitPrice: new Money(linea.precioCobro),
          total: new Money(linea.precioCobro),
        }))
      )
    )

export const resolveTerminadosTotalCobro = (registros: TerminadosProduccionRegistro[]): number =>
  registros
    .filter(registro => resolveTerminadosRegistroCompleto(registro))
    .reduce(
      (acc, registro) =>
        acc +
        resolveTerminadosEntradas(registro).reduce(
          (sum, entrada) => sum + resolveEntradaTerminadosTotal(entrada),
          0
        ),
      0
    )

export interface TerminadosAsignadosRow {
  corteRowKey: string
  planchaLabel: string
  entrada: TerminadosProduccionEntrada
}

export const buildTerminadosAsignadosRows = (
  contexts: TerminadosCorteContext[],
  registros: TerminadosProduccionRegistro[] = []
): TerminadosAsignadosRow[] =>
  contexts.flatMap(context =>
    resolveTerminadosEntradasForContext(registros, context).map(entrada => ({
      corteRowKey: context.corteRowKey,
      planchaLabel: context.shortLabel,
      entrada,
    }))
  )

export interface TerminadosCobroResumenLine {
  corteRowKey: string
  planchaLabel: string
  registrosCount: number
  totalCobro: number
}

export interface TerminadosCobroResumen {
  lineas: TerminadosCobroResumenLine[]
  totalCobro: number
}

export const buildTerminadosCobroResumen = (
  contexts: TerminadosCorteContext[],
  registros: TerminadosProduccionRegistro[] = []
): TerminadosCobroResumen => {
  const lineas = contexts.flatMap(context => {
    const entradas = resolveTerminadosEntradasForContext(registros, context)
    if (entradas.length === 0) return []

    const totalCobro = entradas.reduce(
      (sum, entrada) => sum + resolveEntradaTerminadosTotal(entrada),
      0
    )

    return [
      {
        corteRowKey: context.corteRowKey,
        planchaLabel: context.shortLabel,
        registrosCount: entradas.length,
        totalCobro,
      },
    ]
  })

  return {
    lineas,
    totalCobro: lineas.reduce((sum, linea) => sum + linea.totalCobro, 0),
  }
}

export const terminadosRegistrosEqual = (
  left: TerminadosProduccionRegistro[],
  right: TerminadosProduccionRegistro[]
): boolean => JSON.stringify(left) === JSON.stringify(right)

export const isCorteRowReadyForTerminados = (
  row: PaperRow,
  coloresPlanchas: DisenoColorPlanchaItem[],
  tiposPapel: TipoPapel[],
  margenRedondeo: number,
  clienteSuministraPapel: YesNoChoice
): boolean =>
  isCorteRegistroCompleto(row, coloresPlanchas, tiposPapel, margenRedondeo, clienteSuministraPapel)
