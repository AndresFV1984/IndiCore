import type { ImpresionLadoTintas, ImpresionTipoBifronte } from '../../../../core/domain/entities/Order'
import {
  entradaHasColorBasicoEnTiroYRetiro,
  entradaHasPantoneEnTiroYRetiro,
} from '../utils/impresionColorBasicoTarifaUtils'

export const IMPRESION_VOLTEO_TIPO_OPTIONS: ReadonlyArray<{
  value: Extract<ImpresionTipoBifronte, 'volteo-pinza' | 'volteo-escuadra'>
  label: string
}> = [
  { value: 'volteo-pinza', label: 'Volteo por pinza' },
  { value: 'volteo-escuadra', label: 'Volteo por escuadra' },
]

/** Opciones del select de volteo por grupo (Color básico / Pantone). */
export const IMPRESION_GRUPO_VOLTEO_SELECT_OPTIONS: ReadonlyArray<{
  value: ImpresionTipoBifronte
  label: string
}> = [
  { value: 'diferente-plancha', label: 'Sin volteo' },
  ...IMPRESION_VOLTEO_TIPO_OPTIONS,
]

export const IMPRESION_TIPO_BIFRONTE_OPTIONS: ReadonlyArray<{
  value: ImpresionTipoBifronte
  label: string
}> = [
  ...IMPRESION_VOLTEO_TIPO_OPTIONS,
  { value: 'diferente-plancha', label: 'Diferente Plancha' },
]

export const isImpresionTipoBifronte = (value: unknown): value is ImpresionTipoBifronte =>
  IMPRESION_TIPO_BIFRONTE_OPTIONS.some(option => option.value === value)

export const normalizeImpresionTipoBifronte = (value: unknown): ImpresionTipoBifronte | '' =>
  isImpresionTipoBifronte(value) ? value : ''

export const isImpresionConVolteo = (value: ImpresionTipoBifronte | ''): boolean =>
  value === 'volteo-pinza' || value === 'volteo-escuadra'

/** Volteo exige cavidades de Preprensa definidas y en número par. */
export const canUseImpresionVolteo = (numeroCavidades: number): boolean =>
  Number.isFinite(numeroCavidades) && numeroCavidades > 0 && numeroCavidades % 2 === 0

export type ImpresionVolteoGrupo = 'colorBasico' | 'pantone'

/** Volteo por grupo exige cavidades pares y tintas del grupo en tiro y retiro. */
export const canUseImpresionVolteoForGrupo = (
  grupo: ImpresionVolteoGrupo,
  numeroCavidades: number,
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): boolean => {
  if (!canUseImpresionVolteo(numeroCavidades)) return false
  return grupo === 'colorBasico'
    ? entradaHasColorBasicoEnTiroYRetiro(tiro, retiro)
    : entradaHasPantoneEnTiroYRetiro(tiro, retiro)
}

export const sanitizeImpresionTipoBifronteForCavidades = (
  tipo: ImpresionTipoBifronte | '',
  numeroCavidades: number
): ImpresionTipoBifronte => {
  if (!canUseImpresionVolteo(numeroCavidades) && isImpresionConVolteo(tipo)) {
    return 'diferente-plancha'
  }
  return (tipo || 'diferente-plancha') as ImpresionTipoBifronte
}

export const sanitizeImpresionTipoBifronteForVolteo = (
  tipo: ImpresionTipoBifronte | '',
  grupo: ImpresionVolteoGrupo,
  numeroCavidades: number,
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): ImpresionTipoBifronte => {
  if (
    !canUseImpresionVolteoForGrupo(grupo, numeroCavidades, tiro, retiro) &&
    isImpresionConVolteo(tipo)
  ) {
    return 'diferente-plancha'
  }
  return (tipo || 'diferente-plancha') as ImpresionTipoBifronte
}

export const resolveImpresionConVolteoEnabled = (
  enabled: boolean,
  current: ImpresionTipoBifronte | ''
): ImpresionTipoBifronte =>
  enabled
    ? current === 'volteo-escuadra'
      ? 'volteo-escuadra'
      : 'volteo-pinza'
    : 'diferente-plancha'

export interface ImpresionVolteoBloqueadoCopy {
  cavidadesPares: string
  tiroRetiroColorBasico: string
  tiroRetiroPantone: string
}

export const resolveImpresionVolteoBloqueadoHint = (
  grupo: ImpresionVolteoGrupo,
  numeroCavidades: number,
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  copy: ImpresionVolteoBloqueadoCopy
): string | null => {
  if (canUseImpresionVolteoForGrupo(grupo, numeroCavidades, tiro, retiro)) return null
  if (!canUseImpresionVolteo(numeroCavidades)) return copy.cavidadesPares
  return grupo === 'colorBasico' ? copy.tiroRetiroColorBasico : copy.tiroRetiroPantone
}

