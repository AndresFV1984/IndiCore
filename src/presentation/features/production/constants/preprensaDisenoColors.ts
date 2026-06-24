import { DisenoColoresOption } from '../../../../core/domain/entities/PreprensaDiseno'

/** Sentinel para el swatch de Pantone (mezcla visual de toda la paleta). */
export const DISENO_INK_PANTONE_MIX_SWATCH = 'pantone-mix' as const

export const DISENO_INK_PRIMARIES_COUNT = 4

export const DISENO_INK_SECONDARIES_COUNT = 3

/** Tintas usadas en preprensa para contar colores (sin Pantone). */
export const DISENO_INK_COUNT_PALETTE_SIZE =
  DISENO_INK_PRIMARIES_COUNT + DISENO_INK_SECONDARIES_COUNT

export const DISENO_INK_PANTONE_INDEX = DISENO_INK_COUNT_PALETTE_SIZE

/** Colores base que componen la mezcla visual de Pantone (primarios + secundarios). */
export const DISENO_INK_PANTONE_MIX_COLORS = [
  '#00a9e0',
  '#d6007a',
  '#ffd400',
  '#1a1a1a',
  '#e4002b',
  '#005eb8',
  '#00a651',
] as const

/** Gradiente cónico para representar Pantone como mezcla de toda la paleta. */
export const DISENO_INK_PANTONE_MIX_BACKGROUND = `conic-gradient(from 135deg, ${DISENO_INK_PANTONE_MIX_COLORS.join(', ')}, ${DISENO_INK_PANTONE_MIX_COLORS[0]})`

export const isDisenoInkPantoneMix = (swatch: string): boolean =>
  swatch === DISENO_INK_PANTONE_MIX_SWATCH

/** Paleta completa: 4 primarios + 3 secundarios + Pantone */
export const DISENO_INK_PALETTE = [
  { name: 'Cian', swatch: '#00a9e0' },
  { name: 'Magenta', swatch: '#d6007a' },
  { name: 'Amarillo', swatch: '#ffd400' },
  { name: 'Negro', swatch: '#1a1a1a' },
  { name: 'Rojo', swatch: '#e4002b' },
  { name: 'Azul', swatch: '#005eb8' },
  { name: 'Verde', swatch: '#00a651' },
  { name: 'Pantone', swatch: DISENO_INK_PANTONE_MIX_SWATCH },
] as const

/** Colores visuales de los 4 primarios CMYK de proceso (no muestreados del archivo). */
export const ESTIMAR_TINTAS_PROCESS_CMYK_SWATCHES = {
  c: DISENO_INK_PALETTE[0]!.swatch,
  m: DISENO_INK_PALETTE[1]!.swatch,
  y: DISENO_INK_PALETTE[2]!.swatch,
  k: DISENO_INK_PALETTE[3]!.swatch,
} as const

export const DISENO_INK_PALETTE_SECTIONS = [
  {
    id: 'primarios',
    indices: [0, 1, 2, 3],
  },
  {
    id: 'secundarios',
    indices: [4, 5, 6],
  },
  {
    id: 'pantone',
    indices: [DISENO_INK_PANTONE_INDEX],
  },
] as const

export interface DisenoColoresCountMeta {
  value: DisenoColoresOption
  count: number
  label: string
  shortLabel: string
}

/** Opciones de cantidad de colores (lista 1–7) */
export const DISENO_COLORES_COUNT_OPTIONS: DisenoColoresCountMeta[] = [
  { value: '1-color', count: 1, label: '1-Color', shortLabel: '1' },
  { value: '2-colores', count: 2, label: '2-Colores', shortLabel: '2' },
  { value: '3-colores', count: 3, label: '3-Colores', shortLabel: '3' },
  { value: '4-colores', count: 4, label: '4-Colores', shortLabel: '4' },
  { value: '5-colores', count: 5, label: '5-Colores', shortLabel: '5' },
  { value: '6-colores', count: 6, label: '6-Colores', shortLabel: '6' },
  { value: '7-colores-o-mas', count: 7, label: '7-Colores o m\u00E1s', shortLabel: '7+' },
]

const COUNT_BY_VALUE = new Map(DISENO_COLORES_COUNT_OPTIONS.map(o => [o.value, o]))

/** Migra ids de tinta (versión anterior) a cantidad de colores */
const TINTA_TO_COUNT: Record<string, DisenoColoresOption> = {
  cian: '1-color',
  magenta: '2-colores',
  amarillo: '3-colores',
  negro: '4-colores',
  'rojo-pantone': '5-colores',
  'azul-pantone': '6-colores',
  'verde-pantone': '7-colores-o-mas',
  '7-colores': '7-colores-o-mas',
}

export const getDisenoColoresCountMeta = (
  value: DisenoColoresOption | ''
): DisenoColoresCountMeta | undefined => (value ? COUNT_BY_VALUE.get(value) : undefined)

export const getColoresCountFromOption = (value: DisenoColoresOption | ''): number =>
  getDisenoColoresCountMeta(value)?.count ?? 0

export const normalizeDisenoColoresValue = (
  value: string | DisenoColoresOption | ''
): DisenoColoresOption | '' => {
  if (!value) return ''
  if (COUNT_BY_VALUE.has(value as DisenoColoresOption)) {
    return value as DisenoColoresOption
  }
  return TINTA_TO_COUNT[value] ?? ''
}

/** @deprecated Usar getDisenoColoresCountMeta */
export const getDisenoTintaMeta = getDisenoColoresCountMeta

/** @deprecated Usar DISENO_COLORES_COUNT_OPTIONS */
export const DISENO_TINTA_OPTIONS = DISENO_COLORES_COUNT_OPTIONS
export const DISENO_COLORES_OPTIONS = DISENO_COLORES_COUNT_OPTIONS
