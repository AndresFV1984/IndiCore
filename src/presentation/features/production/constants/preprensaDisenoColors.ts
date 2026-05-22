import { DisenoColoresOption } from '../../../../core/domain/entities/PreprensaDiseno'

/** Tres tonos suaves y claros para indicar cantidad de tintas (orden nueva). */
export const COLORES_DOT_PALETTE = ['#9ec5e8', '#f0b4c8', '#b8e0c8'] as const

export interface DisenoColoresOptionMeta {
  value: DisenoColoresOption
  label: string
  /** Valor numérico mostrado en el campo (ej. 1, 3) */
  numericValue: string
  dotCount: number
  /** Muestra "+" en el icono (solo registros legacy) */
  showPlusInIcon?: boolean
}

/** Opciones al crear orden: máximo 3 colores. */
export const DISENO_COLORES_OPTIONS: DisenoColoresOptionMeta[] = [
  { value: '1-color', label: '1 color', numericValue: '1', dotCount: 1 },
  { value: '2-colores', label: '2 colores', numericValue: '2', dotCount: 2 },
  { value: '3-colores', label: '3 colores', numericValue: '3', dotCount: 3 },
]

/** Lectura de órdenes o historial con más de 3 tintas. */
export const DISENO_COLORES_OPTIONS_LEGACY: DisenoColoresOptionMeta[] = [
  ...DISENO_COLORES_OPTIONS,
  { value: '4-colores', label: '4 colores', numericValue: '4', dotCount: 4 },
  { value: '5-colores', label: '5 colores', numericValue: '5', dotCount: 5 },
  { value: '6-colores', label: '6 colores', numericValue: '6', dotCount: 6 },
  {
    value: '7-colores-o-mas',
    label: '7 colores o más',
    numericValue: '7',
    dotCount: 7,
    showPlusInIcon: true,
  },
]
