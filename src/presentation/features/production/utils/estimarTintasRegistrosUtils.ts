import type {
  EstimarTintasCmykValues,
  ImpresionEstimarTintasEntrada,
  ImpresionEstimarTintasRegistro,
  PaperRow,
} from '../../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import type { TipoPapel } from '../../../../core/domain/entities/TipoPapel'
import { despieceAsociadoMedida } from '../../../../core/domain/entities/CortePapel'
import { formatMedidaDisplayFrom } from '../../catalog/cortePapelUtils'
import { findPaperRowForActiveId } from './cortePapelFaltante'
import {
  normalizeTipoPapelList,
  resolveDespieceForPaperRow,
  syncPaperRowWithTipoPapelCatalog,
} from './tipoPapelDisplay'
import type {
  CmykCoverage,
  EstimarTintasResult,
  EstimarTintasSourceKind,
} from './estimarTintasUtils'
import {
  CMYK_CHANNELS,
  computeEstimarTintasTotalPedidoG,
  ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
  sumCmykCoverage,
  type CmykChannel,
} from './estimarTintasUtils'

export const ESTIMAR_TINTAS_ENTRADAS_POR_PLANCHA_MAX = 1

const normalizeCmykValues = (values: EstimarTintasCmykValues): EstimarTintasCmykValues => ({
  c: Number.isFinite(values.c) ? values.c : 0,
  m: Number.isFinite(values.m) ? values.m : 0,
  y: Number.isFinite(values.y) ? values.y : 0,
  k: Number.isFinite(values.k) ? values.k : 0,
})

export const normalizeImpresionEstimarTintasEntrada = (
  raw: ImpresionEstimarTintasEntrada
): ImpresionEstimarTintasEntrada => {
  const inkG = normalizeCmykValues(raw.inkG)
  const totalInkG =
    typeof raw.totalInkG === 'number' && raw.totalInkG >= 0
      ? raw.totalInkG
      : sumCmykCoverage(inkG)

  return {
    id: raw.id?.trim() ? raw.id : crypto.randomUUID(),
    fileName: raw.fileName?.trim() ?? '',
    sourceKind: raw.sourceKind === 'pdf' ? 'pdf' : 'image',
    widthCm: typeof raw.widthCm === 'number' && raw.widthCm > 0 ? raw.widthCm : 0,
    heightCm: typeof raw.heightCm === 'number' && raw.heightCm > 0 ? raw.heightCm : 0,
    dpi: typeof raw.dpi === 'number' && raw.dpi > 0 ? raw.dpi : 0,
    conversionFactorG:
      typeof raw.conversionFactorG === 'number' && raw.conversionFactorG > 0
        ? raw.conversionFactorG
        : ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
    coverage: normalizeCmykValues(raw.coverage),
    inkG,
    totalInkG,
    totalPliegos:
      typeof raw.totalPliegos === 'number' && raw.totalPliegos >= 0 ? raw.totalPliegos : 0,
    totalInkPedidoG:
      typeof raw.totalInkPedidoG === 'number' && raw.totalInkPedidoG >= 0
        ? raw.totalInkPedidoG
        : computeEstimarTintasTotalPedidoG(
            totalInkG,
            typeof raw.totalPliegos === 'number' && raw.totalPliegos >= 0 ? raw.totalPliegos : 0
          ),
    averageTac:
      typeof raw.averageTac === 'number' && raw.averageTac >= 0 ? raw.averageTac : 0,
    calculatedAt: raw.calculatedAt?.trim() ? raw.calculatedAt : new Date().toISOString(),
    tipoPapelDisplay: raw.tipoPapelDisplay?.trim() ? raw.tipoPapelDisplay.trim() : undefined,
    despieceDisplay: raw.despieceDisplay?.trim() ? raw.despieceDisplay.trim() : undefined,
  }
}

type LegacyImpresionEstimarTintasRegistro = ImpresionEstimarTintasRegistro &
  Partial<ImpresionEstimarTintasEntrada> & {
    id?: string
  }

const clampEntradasPorPlancha = (
  entradas: ImpresionEstimarTintasEntrada[]
): ImpresionEstimarTintasEntrada[] =>
  entradas.slice(0, ESTIMAR_TINTAS_ENTRADAS_POR_PLANCHA_MAX)

export const emptyImpresionEstimarTintasRegistro = (
  colorPlanchaId: string
): ImpresionEstimarTintasRegistro => ({
  colorPlanchaId,
  entradas: [],
})

export const normalizeImpresionEstimarTintasRegistro = (
  raw: LegacyImpresionEstimarTintasRegistro,
  colorPlanchaId: string
): ImpresionEstimarTintasRegistro => {
  if (Array.isArray(raw.entradas)) {
    return {
      colorPlanchaId,
      entradas: clampEntradasPorPlancha(raw.entradas.map(normalizeImpresionEstimarTintasEntrada)),
    }
  }

  if (raw.fileName?.trim() && typeof raw.totalInkG === 'number' && raw.totalInkG > 0) {
    return {
      colorPlanchaId,
      entradas: clampEntradasPorPlancha([
        normalizeImpresionEstimarTintasEntrada({
          id: raw.id?.trim() ? raw.id : crypto.randomUUID(),
          fileName: raw.fileName,
          sourceKind: raw.sourceKind === 'pdf' ? 'pdf' : 'image',
          widthCm: raw.widthCm ?? 0,
          heightCm: raw.heightCm ?? 0,
          dpi: raw.dpi ?? 0,
          conversionFactorG: raw.conversionFactorG ?? 0,
          coverage: normalizeCmykValues(raw.coverage ?? { c: 0, m: 0, y: 0, k: 0 }),
          inkG: normalizeCmykValues(raw.inkG ?? { c: 0, m: 0, y: 0, k: 0 }),
          totalInkG: raw.totalInkG,
          totalInkPedidoG:
            typeof raw.totalInkPedidoG === 'number' && raw.totalInkPedidoG >= 0
              ? raw.totalInkPedidoG
              : computeEstimarTintasTotalPedidoG(raw.totalInkG, raw.totalPliegos ?? 0),
          totalPliegos: raw.totalPliegos ?? 0,
          averageTac: raw.averageTac ?? 0,
          calculatedAt: raw.calculatedAt ?? new Date().toISOString(),
        }),
      ]),
    }
  }

  return emptyImpresionEstimarTintasRegistro(colorPlanchaId)
}

export const isImpresionEstimarTintasPlanchaCompleta = (
  registro: ImpresionEstimarTintasRegistro
): boolean => (registro.entradas?.length ?? 0) > 0

export const resolveEstimarTintasCompletedPlanchaIds = (
  registros: ImpresionEstimarTintasRegistro[] = []
): string[] =>
  registros.filter(isImpresionEstimarTintasPlanchaCompleta).map(item => item.colorPlanchaId)

export type EstimarTintasCorteDisplay = {
  tipoPapelDisplay: string | null
  despieceDisplay: string | null
}

export const resolveEstimarTintasCorteDisplay = (
  colorPlanchaId: string,
  paperRows: PaperRow[] = [],
  tiposPapel: TipoPapel[] = []
): EstimarTintasCorteDisplay => {
  const catalog = normalizeTipoPapelList(tiposPapel)
  const row = syncPaperRowWithTipoPapelCatalog(
    findPaperRowForActiveId(paperRows, colorPlanchaId),
    catalog
  )
  const tipo = row.tipoPapelId ? catalog.find(item => item.id === row.tipoPapelId) ?? null : null
  const despiece = resolveDespieceForPaperRow(row, catalog)

  const tipoPapelDisplay = tipo
    ? `${tipo.name} · ${formatMedidaDisplayFrom(tipo)}`
    : row.type?.trim() && row.size?.trim()
      ? `${row.type.trim()} · ${row.size.trim()}`
      : null

  const despieceDisplay = despiece
    ? `${despiece.name?.trim() || '—'} · ${despieceAsociadoMedida(despiece)}`
    : null

  return { tipoPapelDisplay, despieceDisplay }
}

export type EstimarTintasTableRow = {
  colorPlanchaId: string
  plancha: DisenoColorPlanchaItem
  registro: ImpresionEstimarTintasRegistro
  entrada: ImpresionEstimarTintasEntrada
  corteDisplay: EstimarTintasCorteDisplay
}

export const buildEstimarTintasTableRows = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  registros: ImpresionEstimarTintasRegistro[] = [],
  options?: { paperRows?: PaperRow[]; tiposPapel?: TipoPapel[] }
): EstimarTintasTableRow[] => {
  const byId = new Map(registros.map(item => [item.colorPlanchaId, item]))
  return coloresPlanchas.flatMap(plancha => {
    const registro = byId.get(plancha.id)
    const entrada = registro?.entradas[0]
    if (!registro || !entrada) return []
    const resolved = resolveEstimarTintasCorteDisplay(
      plancha.id,
      options?.paperRows,
      options?.tiposPapel
    )
    return [
      {
        colorPlanchaId: plancha.id,
        plancha,
        registro,
        entrada,
        corteDisplay: {
          tipoPapelDisplay: entrada.tipoPapelDisplay ?? resolved.tipoPapelDisplay,
          despieceDisplay: entrada.despieceDisplay ?? resolved.despieceDisplay,
        },
      },
    ]
  })
}

export const impresionEstimarTintasRegistrosEqual = (
  a: ImpresionEstimarTintasRegistro[],
  b: ImpresionEstimarTintasRegistro[]
): boolean => JSON.stringify(a) === JSON.stringify(b)

export const syncImpresionEstimarTintasRegistros = (
  coloresPlanchas: DisenoColorPlanchaItem[],
  existing: LegacyImpresionEstimarTintasRegistro[] = []
): ImpresionEstimarTintasRegistro[] => {
  const byId = new Map(existing.map(item => [item.colorPlanchaId, item]))
  return coloresPlanchas.map(item => {
    const prev = byId.get(item.id)
    return prev
      ? normalizeImpresionEstimarTintasRegistro(prev, item.id)
      : emptyImpresionEstimarTintasRegistro(item.id)
  })
}

export const patchImpresionEstimarTintasRegistro = (
  registros: ImpresionEstimarTintasRegistro[],
  patch: ImpresionEstimarTintasRegistro
): ImpresionEstimarTintasRegistro[] => {
  const exists = registros.some(item => item.colorPlanchaId === patch.colorPlanchaId)
  if (!exists) return [...registros, normalizeImpresionEstimarTintasRegistro(patch, patch.colorPlanchaId)]
  return registros.map(item =>
    item.colorPlanchaId === patch.colorPlanchaId
      ? normalizeImpresionEstimarTintasRegistro(patch, patch.colorPlanchaId)
      : item
  )
}

const toCmykValues = (coverage: CmykCoverage): EstimarTintasCmykValues => ({
  c: coverage.c,
  m: coverage.m,
  y: coverage.y,
  k: coverage.k,
})

export const createImpresionEstimarTintasEntrada = (
  input: {
    fileName: string
    sourceKind: EstimarTintasSourceKind
    widthCm: number
    heightCm: number
    dpi: number
    conversionFactorG: number
    result: EstimarTintasResult
    totalPliegos: number
    tipoPapelDisplay?: string | null
    despieceDisplay?: string | null
  },
  id?: string
): ImpresionEstimarTintasEntrada =>
  normalizeImpresionEstimarTintasEntrada({
    id: id ?? crypto.randomUUID(),
    fileName: input.fileName,
    sourceKind: input.sourceKind,
    widthCm: input.widthCm,
    heightCm: input.heightCm,
    dpi: input.dpi,
    conversionFactorG: input.conversionFactorG,
    coverage: toCmykValues(input.result.coverage),
    inkG: toCmykValues(input.result.inkG),
    totalInkG: sumCmykCoverage(input.result.inkG),
    totalInkPedidoG: computeEstimarTintasTotalPedidoG(
      sumCmykCoverage(input.result.inkG),
      input.totalPliegos
    ),
    totalPliegos: input.totalPliegos,
    averageTac: input.result.averageTac,
    calculatedAt: new Date().toISOString(),
    tipoPapelDisplay: input.tipoPapelDisplay?.trim() ? input.tipoPapelDisplay.trim() : undefined,
    despieceDisplay: input.despieceDisplay?.trim() ? input.despieceDisplay.trim() : undefined,
  })

export interface EstimarTintasCobroResumen {
  pedidoPorCanal: EstimarTintasCmykValues
  totalEstimadoPliego: number
  totalPedido: number
  registrosCount: number
}

const resolveEntradaTotalPedidoG = (entrada: ImpresionEstimarTintasEntrada): number =>
  entrada.totalInkPedidoG > 0
    ? entrada.totalInkPedidoG
    : computeEstimarTintasTotalPedidoG(entrada.totalInkG, entrada.totalPliegos)

export const buildEstimarTintasCobroResumen = (
  rows: EstimarTintasTableRow[]
): EstimarTintasCobroResumen => {
  const pedidoPorCanal = CMYK_CHANNELS.reduce(
    (acc, channel) => {
      acc[channel] = 0
      return acc
    },
    {} as Record<CmykChannel, number>
  )

  let totalEstimadoPliego = 0
  let totalPedido = 0

  for (const { entrada } of rows) {
    const pliegos = entrada.totalPliegos
    for (const channel of CMYK_CHANNELS) {
      pedidoPorCanal[channel] += entrada.inkG[channel] * pliegos
    }
    totalEstimadoPliego += entrada.totalInkG
    totalPedido += resolveEntradaTotalPedidoG(entrada)
  }

  return {
    pedidoPorCanal,
    totalEstimadoPliego,
    totalPedido,
    registrosCount: rows.length,
  }
}

export const entradaToEstimarTintasResult = (
  entrada: ImpresionEstimarTintasEntrada
): EstimarTintasResult => ({
  coverage: { ...entrada.coverage },
  inkG: { ...entrada.inkG },
  sampledPixels: 0,
  inkedPixels: 0,
  sampleWidth: 0,
  sampleHeight: 0,
  imageWidthPx: 0,
  imageHeightPx: 0,
  averageTac: entrada.averageTac,
})
