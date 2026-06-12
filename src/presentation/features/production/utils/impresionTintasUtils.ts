import type {
  ImpresionLadoTintas,
  ImpresionTintasRegistro,
  ImpresionTiroRetiroEntrada,
} from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import {
  DISENO_INK_PALETTE,
  DISENO_INK_PANTONE_INDEX,
  DISENO_INK_PRIMARIES_COUNT,
} from '../constants/preprensaDisenoColors'
import { normalizeImpresionTipoBifronte } from '../constants/impresionTipoBifronte'
import { getColoresCount } from './coloresPlanchasUtils'
import { formatColoresPlanchaRegistroSelectLabel } from './paperRowsSync'

export const IMPRESION_TINTAS_CANTIDAD_MAX = 12

/** Máximo de registros tiro/retiro por plancha. */
export const IMPRESION_ENTRADAS_POR_PLANCHA_MAX = 1

/** Por debajo de este valor todas las tintas se preasignan como primarios (CMYK). */
export const IMPRESION_TINTAS_PRIMARIOS_UMBRAL = 5

/** Cantidad de tintas primarias en la paleta (Cian, Magenta, Amarillo, Negro). */
export const IMPRESION_TINTAS_PRIMARIOS_CANTIDAD = DISENO_INK_PRIMARIES_COUNT

/** Índice del único Pantone en la paleta. */
export const IMPRESION_INK_PANTONE_INDEX = DISENO_INK_PANTONE_INDEX

/** @deprecated Usar IMPRESION_INK_PANTONE_INDEX */
export const IMPRESION_INK_PANTONE_INDICES = [IMPRESION_INK_PANTONE_INDEX] as const

export const IMPRESION_TINTAS_PALETTE_SIZE = DISENO_INK_PALETTE.length

export const isValidImpresionTintaIndex = (value: number): boolean =>
  Number.isInteger(value) && value >= 0 && value < IMPRESION_TINTAS_PALETTE_SIZE

/** Normaliza índices legacy de paletas anteriores. */
export const normalizeImpresionInkIndex = (value: number): number => {
  if (!Number.isInteger(value)) return -1
  // Legacy: Verde Pantone o Pantone único en paleta de 6/7 colores.
  if (value === 6) return IMPRESION_INK_PANTONE_INDEX
  return value
}

export const isImpresionPantoneInkIndex = (value: number): boolean =>
  normalizeImpresionInkIndex(value) === IMPRESION_INK_PANTONE_INDEX

/** Valores por defecto: CMYK, secundarios y Pantone según la cantidad; el resto pendiente. */
export const buildLadoInkDefaults = (cantidad: number): number[] => {
  if (cantidad <= 0) return []
  return Array.from({ length: cantidad }, (_, i) => {
    if (i < IMPRESION_TINTAS_PRIMARIOS_CANTIDAD) return i
    if (i < IMPRESION_INK_PANTONE_INDEX) return i
    if (i === IMPRESION_INK_PANTONE_INDEX) return IMPRESION_INK_PANTONE_INDEX
    return -1
  })
}

/** @deprecated Usar buildLadoInkDefaults */
export const buildPrimaryInkIndices = buildLadoInkDefaults

/** Todas las tintas son primarios (cantidad 1–4). */
export const shouldUsePrimaryInks = (cantidad: number): boolean =>
  cantidad > 0 && cantidad < IMPRESION_TINTAS_PRIMARIOS_UMBRAL

/** CMYK precargado + tintas adicionales (cantidad 5+). */
export const usesPartialPrimaryInks = (cantidad: number): boolean =>
  cantidad >= IMPRESION_TINTAS_PRIMARIOS_UMBRAL

const mergeLadoTintasWithDefaults = (
  cantidad: number,
  prevTintas: number[]
): number[] =>
  buildLadoInkDefaults(cantidad).map((defaultVal, i) => {
    const prev = normalizeImpresionInkIndex(prevTintas[i] ?? -1)
    return isValidImpresionTintaIndex(prev) ? prev : defaultVal
  })

export const clampImpresionTintasCantidad = (value: number): number =>
  Math.max(0, Math.min(IMPRESION_TINTAS_CANTIDAD_MAX, Math.floor(value)))

/** Cantidad máxima de tintas según el registro de preprensa (p. ej. 4-colores → 4). */
export const resolvePlanchaColoresMax = (item: DisenoColorPlanchaItem): number => {
  const base = getColoresCount(item.colores)
  if (item.colores === '7-colores-o-mas' && item.numeroPlanchas >= 7) {
    return item.numeroPlanchas
  }
  return Math.max(0, base)
}

export const formatImpresionPlanchaColoresLabel = (item: DisenoColorPlanchaItem): string => {
  const count = resolvePlanchaColoresMax(item)
  if (item.colores === '7-colores-o-mas' && count <= 7) return '7+ colores'
  return count === 1 ? '1 color' : `${count} colores`
}

export const formatImpresionPlanchaSelectLabel = (item: DisenoColorPlanchaItem): string =>
  formatColoresPlanchaRegistroSelectLabel(item)

export type ImpresionTintasGrupoVariant = 'colorBasico' | 'pantone'

export const filterLadoInkIndicesByGrupo = (
  lado: ImpresionLadoTintas,
  variant: ImpresionTintasGrupoVariant
): number[] =>
  lado.tintas.slice(0, lado.cantidad).filter(ink => {
    const normalized = normalizeImpresionInkIndex(ink)
    if (!isValidImpresionTintaIndex(normalized)) return false
    const isPantone = isImpresionPantoneInkIndex(normalized)
    return variant === 'pantone' ? isPantone : !isPantone
  })

export const countLadoInkIndicesByGrupo = (
  lado: ImpresionLadoTintas,
  variant: ImpresionTintasGrupoVariant
): number => filterLadoInkIndicesByGrupo(lado, variant).length

export const formatImpresionLadoTintasResumen = (
  label: string,
  lado: ImpresionLadoTintas
): string => {
  if (lado.cantidad <= 0) return `${label}: —`
  const nombres = lado.tintas.slice(0, lado.cantidad).map(index =>
    isValidImpresionTintaIndex(normalizeImpresionInkIndex(index))
      ? DISENO_INK_PALETTE[normalizeImpresionInkIndex(index)]!.name
      : 'Sin asignar'
  )
  return `${label}: ${lado.cantidad} (${nombres.join(', ')})`
}

/** Ajusta tiro y retiro del borrador al límite de la plancha. */
export const clampImpresionEntradaDraftSides = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  maxColores: number
): { tiro: ImpresionLadoTintas; retiro: ImpresionLadoTintas } => {
  const entrada = clampImpresionEntradaToPlanchaColores(
    createImpresionTiroRetiroEntrada(tiro, retiro),
    maxColores
  )
  return { tiro: entrada.tiro, retiro: entrada.retiro }
}

export const resolveImpresionLadoMaxCantidad = (
  maxColoresPlancha: number,
  otherLadoCantidad: number
): number => Math.max(0, maxColoresPlancha - clampImpresionTintasCantidad(otherLadoCantidad))

export const applyImpresionLadoCantidadWithLimit = (
  lado: ImpresionLadoTintas,
  cantidadRaw: number,
  maxColoresPlancha: number,
  otherLadoCantidad: number
): ImpresionLadoTintas => {
  const maxForLado = resolveImpresionLadoMaxCantidad(maxColoresPlancha, otherLadoCantidad)
  const cantidad = Math.min(clampImpresionTintasCantidad(cantidadRaw), maxForLado)
  return applyImpresionLadoCantidadChange(lado, cantidad)
}

export const clampImpresionEntradaToPlanchaColores = (
  entrada: ImpresionTiroRetiroEntrada,
  maxColores: number
): ImpresionTiroRetiroEntrada => {
  const normalized = normalizeImpresionEntrada(entrada)
  let tiroCant = normalized.tiro.cantidad
  let retiroCant = normalized.retiro.cantidad

  if (tiroCant + retiroCant > maxColores) {
    retiroCant = Math.min(retiroCant, Math.max(0, maxColores - tiroCant))
    tiroCant = Math.min(tiroCant, Math.max(0, maxColores - retiroCant))
  }

  return {
    ...normalized,
    tiro:
      tiroCant === normalized.tiro.cantidad
        ? normalized.tiro
        : applyImpresionLadoCantidadChange(normalized.tiro, tiroCant),
    retiro:
      retiroCant === normalized.retiro.cantidad
        ? normalized.retiro
        : applyImpresionLadoCantidadChange(normalized.retiro, retiroCant),
  }
}

export const sumImpresionEntradaTintas = (entrada: ImpresionTiroRetiroEntrada): number =>
  clampImpresionTintasCantidad(entrada.tiro.cantidad) +
  clampImpresionTintasCantidad(entrada.retiro.cantidad)

export const sumImpresionRegistroTintas = (registro: ImpresionTintasRegistro): number =>
  registro.entradas.reduce((total, entrada) => total + sumImpresionEntradaTintas(entrada), 0)

export const emptyImpresionLadoTintas = (): ImpresionLadoTintas => ({
  cantidad: 0,
  tintas: [],
})

export const emptyImpresionTiroRetiroEntrada = (): ImpresionTiroRetiroEntrada => ({
  id: crypto.randomUUID(),
  tiro: emptyImpresionLadoTintas(),
  retiro: emptyImpresionLadoTintas(),
})

export const createImpresionTiroRetiroEntrada = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  id?: string
): ImpresionTiroRetiroEntrada => ({
  id: id ?? crypto.randomUUID(),
  tiro: normalizeLadoTintas(tiro),
  retiro: normalizeLadoTintas(retiro),
})

export const emptyImpresionTintasRegistro = (
  colorPlanchaId: string
): ImpresionTintasRegistro => ({
  colorPlanchaId,
  entradas: [],
  tipoBifronte: 'diferente-plancha',
})

export const isImpresionTipoBifronteComplete = (
  registro: Pick<ImpresionTintasRegistro, 'tipoBifronte'>
): boolean => Boolean(registro.tipoBifronte)

const normalizeLadoTintas = (lado: ImpresionLadoTintas): ImpresionLadoTintas => {
  const cantidad = Math.max(0, Math.floor(lado.cantidad ?? 0))
  if (cantidad <= 0) return emptyImpresionLadoTintas()

  const raw = Array.isArray(lado.tintas) ? lado.tintas : []
  const tintas = mergeLadoTintasWithDefaults(
    cantidad,
    raw.map(value => normalizeImpresionInkIndex(typeof value === 'number' ? value : -1))
  )

  return { cantidad, tintas }
}

export const normalizeImpresionEntrada = (
  entrada: ImpresionTiroRetiroEntrada
): ImpresionTiroRetiroEntrada => ({
  id: entrada.id?.trim() ? entrada.id : crypto.randomUUID(),
  tiro: normalizeLadoTintas(entrada.tiro),
  retiro: normalizeLadoTintas(entrada.retiro),
  cantidadTintasColorBasico:
    typeof entrada.cantidadTintasColorBasico === 'number' && entrada.cantidadTintasColorBasico >= 0
      ? entrada.cantidadTintasColorBasico
      : 0,
  cantidadTintasPantone:
    typeof entrada.cantidadTintasPantone === 'number' && entrada.cantidadTintasPantone >= 0
      ? entrada.cantidadTintasPantone
      : 0,
  millaresColorBasico:
    typeof entrada.millaresColorBasico === 'number' && entrada.millaresColorBasico >= 0
      ? entrada.millaresColorBasico
      : 0,
  millaresPantone:
    typeof entrada.millaresPantone === 'number' && entrada.millaresPantone >= 0
      ? entrada.millaresPantone
      : 0,
  precioTintaColorBasico:
    typeof entrada.precioTintaColorBasico === 'number' && entrada.precioTintaColorBasico >= 0
      ? entrada.precioTintaColorBasico
      : 0,
  precioTintaPantone:
    typeof entrada.precioTintaPantone === 'number' && entrada.precioTintaPantone >= 0
      ? entrada.precioTintaPantone
      : 0,
  precioTinta:
    typeof entrada.precioTinta === 'number' && entrada.precioTinta >= 0
      ? entrada.precioTinta
      : (typeof entrada.precioTintaColorBasico === 'number' ? entrada.precioTintaColorBasico : 0) +
        (typeof entrada.precioTintaPantone === 'number' ? entrada.precioTintaPantone : 0),
  millaresVolteo:
    typeof entrada.millaresVolteo === 'number' && entrada.millaresVolteo >= 0
      ? entrada.millaresVolteo
      : 0,
  precioVolteo:
    typeof entrada.precioVolteo === 'number' && entrada.precioVolteo >= 0 ? entrada.precioVolteo : 0,
})

type LegacyImpresionTintasRegistro = ImpresionTintasRegistro & {
  tiro?: ImpresionLadoTintas
  retiro?: ImpresionLadoTintas
}

export const isImpresionPlanchaCompleta = (registro: ImpresionTintasRegistro): boolean =>
  (registro.entradas?.length ?? 0) > 0

export const resolveCompletedPlanchaIds = (registros: ImpresionTintasRegistro[]): string[] =>
  registros.filter(isImpresionPlanchaCompleta).map(item => item.colorPlanchaId)

export type ImpresionTintasTableRow = {
  colorPlanchaId: string
  plancha: DisenoColorPlanchaItem
  entrada: ImpresionTiroRetiroEntrada
  maxColoresPlancha: number
}

export const buildImpresionTintasTableRows = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  registros: ImpresionTintasRegistro[] = []
): ImpresionTintasTableRow[] => {
  const byId = new Map(registros.map(item => [item.colorPlanchaId, item]))
  return coloresPlanchas.flatMap(plancha => {
    const entrada = byId.get(plancha.id)?.entradas[0]
    if (!entrada) return []
    return [
      {
        colorPlanchaId: plancha.id,
        plancha,
        entrada,
        maxColoresPlancha: resolvePlanchaColoresMax(plancha),
      },
    ]
  })
}

const clampEntradasPorPlancha = (
  entradas: ImpresionTiroRetiroEntrada[]
): ImpresionTiroRetiroEntrada[] => entradas.slice(0, IMPRESION_ENTRADAS_POR_PLANCHA_MAX)

const normalizeImpresionTintasRegistro = (
  raw: LegacyImpresionTintasRegistro,
  colorPlanchaId: string,
  maxColores: number
): ImpresionTintasRegistro => {
  const tipoBifronte = normalizeImpresionTipoBifronte(raw.tipoBifronte)
  const tipoBifronteColorBasico = normalizeImpresionTipoBifronte(
    raw.tipoBifronteColorBasico ?? raw.tipoBifronte
  )
  const tipoBifrontePantone = normalizeImpresionTipoBifronte(
    raw.tipoBifrontePantone ?? raw.tipoBifronte
  )

  const tarifaVolteoMillarId =
    typeof raw.tarifaVolteoMillarId === 'string' ? raw.tarifaVolteoMillarId : ''
  const precioVolteoMillar =
    typeof raw.precioVolteoMillar === 'number' && raw.precioVolteoMillar >= 0
      ? raw.precioVolteoMillar
      : 0
  const tarifaColorBasicoMillarId =
    typeof raw.tarifaColorBasicoMillarId === 'string' ? raw.tarifaColorBasicoMillarId : ''
  const precioColorBasicoMillar =
    typeof raw.precioColorBasicoMillar === 'number' && raw.precioColorBasicoMillar >= 0
      ? raw.precioColorBasicoMillar
      : 0
  const tarifaPantoneMillarId =
    typeof raw.tarifaPantoneMillarId === 'string' ? raw.tarifaPantoneMillarId : ''
  const precioPantoneMillar =
    typeof raw.precioPantoneMillar === 'number' && raw.precioPantoneMillar >= 0
      ? raw.precioPantoneMillar
      : 0
  const tarifaVolteoColorBasicoMillarId =
    typeof raw.tarifaVolteoColorBasicoMillarId === 'string'
      ? raw.tarifaVolteoColorBasicoMillarId
      : raw.tarifaVolteoMillarId ?? ''
  const precioVolteoColorBasicoMillar =
    typeof raw.precioVolteoColorBasicoMillar === 'number' && raw.precioVolteoColorBasicoMillar >= 0
      ? raw.precioVolteoColorBasicoMillar
      : raw.precioVolteoMillar ?? 0
  const tarifaVolteoPantoneMillarId =
    typeof raw.tarifaVolteoPantoneMillarId === 'string'
      ? raw.tarifaVolteoPantoneMillarId
      : raw.tarifaVolteoMillarId ?? ''
  const precioVolteoPantoneMillar =
    typeof raw.precioVolteoPantoneMillar === 'number' && raw.precioVolteoPantoneMillar >= 0
      ? raw.precioVolteoPantoneMillar
      : raw.precioVolteoMillar ?? 0

  if (Array.isArray(raw.entradas)) {
    return {
      colorPlanchaId,
      tipoBifronte,
      tipoBifronteColorBasico,
      tipoBifrontePantone,
      tarifaVolteoMillarId,
      precioVolteoMillar,
      tarifaVolteoColorBasicoMillarId,
      precioVolteoColorBasicoMillar,
      tarifaVolteoPantoneMillarId,
      precioVolteoPantoneMillar,
      tarifaColorBasicoMillarId,
      precioColorBasicoMillar,
      tarifaPantoneMillarId,
      precioPantoneMillar,
      entradas: clampEntradasPorPlancha(
        raw.entradas
          .map(normalizeImpresionEntrada)
          .map(entrada => clampImpresionEntradaToPlanchaColores(entrada, maxColores))
      ),
    }
  }

  const tiro = raw.tiro ? normalizeLadoTintas(raw.tiro) : emptyImpresionLadoTintas()
  const retiro = raw.retiro ? normalizeLadoTintas(raw.retiro) : emptyImpresionLadoTintas()
  const hasData = tiro.cantidad > 0 || retiro.cantidad > 0

  return {
    colorPlanchaId,
    tipoBifronte,
    tipoBifronteColorBasico,
    tipoBifrontePantone,
    tarifaVolteoMillarId,
    precioVolteoMillar,
    tarifaVolteoColorBasicoMillarId,
    precioVolteoColorBasicoMillar,
    tarifaVolteoPantoneMillarId,
    precioVolteoPantoneMillar,
    tarifaColorBasicoMillarId,
    precioColorBasicoMillar,
    tarifaPantoneMillarId,
    precioPantoneMillar,
    entradas: hasData
      ? [
          clampImpresionEntradaToPlanchaColores(
            createImpresionTiroRetiroEntrada(tiro, retiro),
            maxColores
          ),
        ]
      : [],
  }
}

export const applyImpresionLadoCantidadChange = (
  lado: ImpresionLadoTintas,
  cantidadRaw: number
): ImpresionLadoTintas => {
  const cantidad = clampImpresionTintasCantidad(cantidadRaw)
  if (cantidad <= 0) return emptyImpresionLadoTintas()

  const tintas = mergeLadoTintasWithDefaults(cantidad, lado.tintas ?? [])

  return { cantidad, tintas }
}

export const updateImpresionLadoTinta = (
  lado: ImpresionLadoTintas,
  slotIndex: number,
  inkIndex: number
): ImpresionLadoTintas => {
  if (slotIndex < 0 || slotIndex >= lado.cantidad) return lado
  const normalized = normalizeImpresionInkIndex(inkIndex)
  const tintas = [...lado.tintas]
  tintas[slotIndex] = isValidImpresionTintaIndex(normalized) ? normalized : -1
  return { ...lado, tintas }
}

export const isImpresionLadoComplete = (lado: ImpresionLadoTintas): boolean =>
  lado.cantidad <= 0 ||
  lado.tintas.slice(0, lado.cantidad).every(index => isValidImpresionTintaIndex(normalizeImpresionInkIndex(index)))

export const isImpresionEntradaDraftValid = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  maxColores: number
): boolean => {
  if (maxColores <= 0) return false
  const total = tiro.cantidad + retiro.cantidad
  if (total !== maxColores) return false
  return isImpresionLadoComplete(tiro) && isImpresionLadoComplete(retiro)
}

export const impresionTintasRegistrosEqual = (
  a: ImpresionTintasRegistro[],
  b: ImpresionTintasRegistro[]
): boolean => JSON.stringify(a) === JSON.stringify(b)

export const syncImpresionTintasRegistros = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  existing: LegacyImpresionTintasRegistro[] = []
): ImpresionTintasRegistro[] => {
  const byId = new Map(existing.map(item => [item.colorPlanchaId, item]))
  return coloresPlanchas.map(item => {
    const prev = byId.get(item.id)
    const maxColores = resolvePlanchaColoresMax(item)
    return prev
      ? normalizeImpresionTintasRegistro(prev, item.id, maxColores)
      : emptyImpresionTintasRegistro(item.id)
  })
}

export const patchImpresionTintasRegistro = (
  registros: ImpresionTintasRegistro[],
  patch: ImpresionTintasRegistro
): ImpresionTintasRegistro[] => {
  const exists = registros.some(item => item.colorPlanchaId === patch.colorPlanchaId)
  if (!exists) return [...registros, patch]
  return registros.map(item => (item.colorPlanchaId === patch.colorPlanchaId ? patch : item))
}
