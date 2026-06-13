import { Money } from '../../../../core/domain/value-objects/Money'
import type {
  AcabadoProduccionLinea,
  AcabadoProduccionOrigen,
  AcabadosProduccionEntrada,
  AcabadosProduccionRegistro,
  OperationItem,
  PaperRow,
} from '../../../../core/domain/entities/Order'
import type { CatalogRecord } from '../../catalog/catalogRecord'
import { parseCatalogNumeric, parseCatalogValorCmCuadrado } from '../../catalog/catalogRecord'
import { computeTerminadoPrecio } from './terminadoPricingUtils'
import {
  buildTerminadosCorteContexts,
  resolveTerminadosContextPlancha,
  type TerminadosCorteContext,
} from './terminadosUtils'

export type AcabadosCorteContext = TerminadosCorteContext

export const buildAcabadosCorteContexts = buildTerminadosCorteContexts
export const resolveAcabadosContextPlancha = resolveTerminadosContextPlancha

export const createAcabadosProduccionEntrada = (
  lineas: AcabadoProduccionLinea[],
  id?: string
): AcabadosProduccionEntrada => ({
  id: id ?? crypto.randomUUID(),
  lineas,
})

export const resolveAcabadosEntradas = (
  registro: AcabadosProduccionRegistro
): AcabadosProduccionEntrada[] => {
  if (Array.isArray(registro.entradas)) return registro.entradas
  return []
}

export const acabadosRegistroMatchesContext = (
  registro: AcabadosProduccionRegistro,
  context: AcabadosCorteContext
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

export const findAcabadosRegistroForContext = (
  registros: AcabadosProduccionRegistro[],
  context: AcabadosCorteContext
): AcabadosProduccionRegistro | null =>
  registros.find(registro => acabadosRegistroMatchesContext(registro, context)) ?? null

export const resolveAcabadosEntradasForContext = (
  registros: AcabadosProduccionRegistro[],
  context: AcabadosCorteContext
): AcabadosProduccionEntrada[] =>
  registros
    .filter(registro => acabadosRegistroMatchesContext(registro, context))
    .flatMap(registro => resolveAcabadosEntradas(registro))

export const patchAcabadosRegistroForContext = (
  registros: AcabadosProduccionRegistro[],
  context: AcabadosCorteContext,
  entradas: AcabadosProduccionEntrada[]
): AcabadosProduccionRegistro[] => {
  const withoutMatches = registros.filter(
    registro => !acabadosRegistroMatchesContext(registro, context)
  )
  if (entradas.length === 0) {
    return withoutMatches
  }
  const next: AcabadosProduccionRegistro = {
    corteRowKey: context.corteRowKey,
    colorPlanchaId: context.row.colorPlanchaId,
    corteRowId: context.row.corteRowId,
    entradas,
    completo: true,
  }
  return [...withoutMatches, next]
}

export const resolveEntradaAcabadosCount = (entrada: AcabadosProduccionEntrada): number =>
  entrada.lineas.length

export const resolveEntradaAcabadosTotal = (entrada: AcabadosProduccionEntrada): number =>
  entrada.lineas.reduce((sum, linea) => sum + linea.precioCobro, 0)

export const resolveEntradaAcabadosNombres = (entrada: AcabadosProduccionEntrada): string[] =>
  entrada.lineas.map(linea => linea.operacionNombre.trim()).filter(Boolean)

export const formatEntradaAcabadosResumen = (entrada: AcabadosProduccionEntrada): string =>
  resolveEntradaAcabadosNombres(entrada).join(', ') || '—'

export const buildAcabadoProduccionLinea = (
  operacion: CatalogRecord,
  row: PaperRow,
  tamanosBuenos: number,
  origen: AcabadoProduccionOrigen = 'acceso-directo'
): AcabadoProduccionLinea => {
  const valorCmCuadrado = parseCatalogValorCmCuadrado(operacion.valorCmCuadrado)
  const costoMinimo = parseCatalogNumeric(operacion.cost)
  const ancho = row.despiece?.ancho ?? '0'
  const alto = row.despiece?.alto ?? '0'
  const pricing = computeTerminadoPrecio(ancho, alto, valorCmCuadrado, tamanosBuenos, costoMinimo)

  return {
    id: crypto.randomUUID(),
    operacionId: operacion.id,
    operacionNombre: operacion.name,
    valorCmCuadrado,
    costoMinimo,
    areaFactor: pricing.areaFactor,
    tamanosBuenos,
    precioCalculado: pricing.precioCalculado,
    precioCobro: pricing.precioCobro,
    origen,
  }
}

export const recalculateAcabadoLinea = (
  linea: AcabadoProduccionLinea,
  row: PaperRow,
  tamanosBuenos: number
): AcabadoProduccionLinea => {
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

export const syncAcabadosRegistros = (
  coloresPlanchas: Parameters<typeof buildTerminadosCorteContexts>[0],
  paperRows: PaperRow[],
  tiposPapel: Parameters<typeof buildTerminadosCorteContexts>[2],
  margenRedondeo: number,
  clienteSuministraPapel: Parameters<typeof buildTerminadosCorteContexts>[4],
  registros: AcabadosProduccionRegistro[]
): AcabadosProduccionRegistro[] => {
  const contexts = buildAcabadosCorteContexts(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  )

  return contexts.flatMap(ctx => {
    const matching = registros.filter(registro => acabadosRegistroMatchesContext(registro, ctx))
    if (matching.length === 0) return []

    const entradas = matching
      .flatMap(registro => resolveAcabadosEntradas(registro))
      .map(entrada => ({
        ...entrada,
        lineas: entrada.lineas.map(linea =>
          recalculateAcabadoLinea(linea, ctx.row, ctx.tamanosBuenos)
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

export const resolveAcabadosRegistroCompleto = (
  registro: AcabadosProduccionRegistro
): boolean => resolveAcabadosEntradas(registro).length > 0

export const resolveCompletedAcabadosCorteRowKeys = (
  coloresPlanchas: Parameters<typeof buildTerminadosCorteContexts>[0],
  paperRows: PaperRow[],
  tiposPapel: Parameters<typeof buildTerminadosCorteContexts>[2],
  margenRedondeo: number,
  clienteSuministraPapel: Parameters<typeof buildTerminadosCorteContexts>[4],
  registros: AcabadosProduccionRegistro[]
): string[] => {
  const contexts = buildAcabadosCorteContexts(
    coloresPlanchas,
    paperRows,
    tiposPapel,
    margenRedondeo,
    clienteSuministraPapel
  )
  return contexts
    .filter(ctx => ctx.completo && resolveAcabadosEntradasForContext(registros, ctx).length > 0)
    .map(ctx => ctx.corteRowKey)
}

export const patchAcabadosRegistro = (
  registros: AcabadosProduccionRegistro[],
  next: AcabadosProduccionRegistro
): AcabadosProduccionRegistro[] => {
  const entradas = resolveAcabadosEntradas(next)
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

export const buildOperationsFromAcabadosRegistros = (
  registros: AcabadosProduccionRegistro[]
): OperationItem[] =>
  registros
    .filter(registro => resolveAcabadosRegistroCompleto(registro))
    .flatMap(registro =>
      resolveAcabadosEntradas(registro).flatMap(entrada =>
        entrada.lineas.map(linea => ({
          name: linea.operacionNombre,
          value: new Money(linea.precioCobro),
        }))
      )
    )

export const resolveAcabadosTotalCobro = (registros: AcabadosProduccionRegistro[]): number =>
  registros
    .filter(registro => resolveAcabadosRegistroCompleto(registro))
    .reduce(
      (acc, registro) =>
        acc +
        resolveAcabadosEntradas(registro).reduce(
          (sum, entrada) => sum + resolveEntradaAcabadosTotal(entrada),
          0
        ),
      0
    )

export interface AcabadosAsignadosRow {
  corteRowKey: string
  planchaLabel: string
  entrada: AcabadosProduccionEntrada
}

export const buildAcabadosAsignadosRows = (
  contexts: AcabadosCorteContext[],
  registros: AcabadosProduccionRegistro[] = []
): AcabadosAsignadosRow[] =>
  contexts.flatMap(context =>
    resolveAcabadosEntradasForContext(registros, context).map(entrada => ({
      corteRowKey: context.corteRowKey,
      planchaLabel: context.label,
      entrada,
    }))
  )

export interface AcabadosCobroResumenLine {
  corteRowKey: string
  planchaLabel: string
  registrosCount: number
  totalCobro: number
}

export interface AcabadosCobroResumen {
  lineas: AcabadosCobroResumenLine[]
  totalCobro: number
}

export const buildAcabadosCobroResumen = (
  contexts: AcabadosCorteContext[],
  registros: AcabadosProduccionRegistro[] = []
): AcabadosCobroResumen => {
  const lineas = contexts.flatMap(context => {
    const entradas = resolveAcabadosEntradasForContext(registros, context)
    if (entradas.length === 0) return []

    const totalCobro = entradas.reduce(
      (sum, entrada) => sum + resolveEntradaAcabadosTotal(entrada),
      0
    )

    return [
      {
        corteRowKey: context.corteRowKey,
        planchaLabel: context.label,
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

export const acabadosRegistrosEqual = (
  left: AcabadosProduccionRegistro[],
  right: AcabadosProduccionRegistro[]
): boolean => JSON.stringify(left) === JSON.stringify(right)
