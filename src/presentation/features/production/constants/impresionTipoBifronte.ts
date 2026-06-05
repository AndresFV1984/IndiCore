import type { ImpresionTipoBifronte } from '../../../../core/domain/entities/Order'

export const IMPRESION_VOLTEO_TIPO_OPTIONS: ReadonlyArray<{
  value: Extract<ImpresionTipoBifronte, 'volteo-pinza' | 'volteo-escuadra'>
  label: string
}> = [
  { value: 'volteo-pinza', label: 'Volteo por pinza' },
  { value: 'volteo-escuadra', label: 'Volteo por escuadra' },
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

export const resolveImpresionConVolteoEnabled = (
  enabled: boolean,
  current: ImpresionTipoBifronte | ''
): ImpresionTipoBifronte =>
  enabled
    ? current === 'volteo-escuadra'
      ? 'volteo-escuadra'
      : 'volteo-pinza'
    : 'diferente-plancha'

export const IMPRESION_VOLTEO_TARIFA_NAME: Record<
  Extract<ImpresionTipoBifronte, 'volteo-pinza' | 'volteo-escuadra'>,
  string
> = {
  'volteo-pinza': 'Volteo por pinza',
  'volteo-escuadra': 'Volteo por escuadra',
}
