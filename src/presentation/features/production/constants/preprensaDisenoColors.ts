import { DisenoColoresOption } from '../../../../core/domain/entities/PreprensaDiseno'

/** Paleta fija de tintas (orden 1–7 para los puntos de color) */
export const DISENO_INK_PALETTE = [
  { name: 'Cian', swatch: '#00a9e0' },
  { name: 'Magenta', swatch: '#d6007a' },
  { name: 'Amarillo', swatch: '#ffd400' },
  { name: 'Negro', swatch: '#1a1a1a' },
  { name: 'Rojo', swatch: '#e4002b' },
  { name: 'Azul Pantone', swatch: '#005eb8' },
  { name: 'Verde Pantone', swatch: '#00a651' },
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
