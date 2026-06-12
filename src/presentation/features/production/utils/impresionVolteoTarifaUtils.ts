import type { ImpresionTipoBifronte } from '../../../../core/domain/entities/Order'
import type { TarifaMillar, TarifaMillarPricing } from '../../../../core/domain/entities/TarifaMillar'
import {
  IMPRESION_VOLTEO_MILLAR_RULES,
  resolveTarifaMillarPrecioVolteoPorTipo,
} from '../constants/impresionTarifaMillar'
import { isImpresionConVolteo } from '../constants/impresionTipoBifronte'
import {
  resolveTarifaColorBasicoMillar,
  resolveTarifaPantoneMillar,
} from './impresionColorBasicoTarifaUtils'

export interface ImpresionTintasRegistroVolteoPatch {
  tarifaVolteoMillarId: string
  precioVolteoMillar: number
}

export interface ImpresionTintasRegistroColorBasicoVolteoPatch {
  tarifaVolteoColorBasicoMillarId: string
  precioVolteoColorBasicoMillar: number
}

export interface ImpresionTintasRegistroPantoneVolteoPatch {
  tarifaVolteoPantoneMillarId: string
  precioVolteoPantoneMillar: number
}

const emptyColorBasicoVolteoPatch = (): ImpresionTintasRegistroColorBasicoVolteoPatch => ({
  tarifaVolteoColorBasicoMillarId: '',
  precioVolteoColorBasicoMillar: 0,
})

const emptyPantoneVolteoPatch = (): ImpresionTintasRegistroPantoneVolteoPatch => ({
  tarifaVolteoPantoneMillarId: '',
  precioVolteoPantoneMillar: 0,
})

export const getImpresionVolteoMillarRules = () => IMPRESION_VOLTEO_MILLAR_RULES

export const getImpresionVolteoMillarRulesFromTarifa = (
  tarifa: TarifaMillar | null | undefined
): TarifaMillarPricing => {
  if (!tarifa) return IMPRESION_VOLTEO_MILLAR_RULES
  return {
    precio: 0,
    millarMinimoVenta: tarifa.millarMinimoVenta,
    topeMinimoMillar: tarifa.topeMinimoMillar,
    umbralDecimalMillar: tarifa.umbralDecimalMillar,
  }
}

const resolveVolteoPrecioFromTarifa = (
  tarifa: TarifaMillar | null,
  tipoBifronte: ImpresionTipoBifronte | ''
): number => resolveTarifaMillarPrecioVolteoPorTipo(tarifa, tipoBifronte)

export const resolvePrecioVolteoMillarPatch = (
  tarifas: TarifaMillar[],
  tipoBifronte: ImpresionTipoBifronte | ''
): ImpresionTintasRegistroVolteoPatch => {
  if (!isImpresionConVolteo(tipoBifronte)) {
    return { tarifaVolteoMillarId: '', precioVolteoMillar: 0 }
  }
  const tarifa = resolveTarifaColorBasicoMillar(tarifas)
  return {
    tarifaVolteoMillarId: tarifa?.id ?? '',
    precioVolteoMillar: resolveVolteoPrecioFromTarifa(tarifa, tipoBifronte),
  }
}

export const resolveColorBasicoVolteoMillarPatch = (
  tarifas: TarifaMillar[],
  tipoBifronte: ImpresionTipoBifronte | ''
): ImpresionTintasRegistroColorBasicoVolteoPatch => {
  if (!isImpresionConVolteo(tipoBifronte)) return emptyColorBasicoVolteoPatch()
  const tarifa = resolveTarifaColorBasicoMillar(tarifas)
  return {
    tarifaVolteoColorBasicoMillarId: tarifa?.id ?? '',
    precioVolteoColorBasicoMillar: resolveVolteoPrecioFromTarifa(tarifa, tipoBifronte),
  }
}

export const resolvePantoneVolteoMillarPatch = (
  tarifas: TarifaMillar[],
  tipoBifronte: ImpresionTipoBifronte | ''
): ImpresionTintasRegistroPantoneVolteoPatch => {
  if (!isImpresionConVolteo(tipoBifronte)) return emptyPantoneVolteoPatch()
  const tarifa = resolveTarifaPantoneMillar(tarifas)
  return {
    tarifaVolteoPantoneMillarId: tarifa?.id ?? '',
    precioVolteoPantoneMillar: resolveVolteoPrecioFromTarifa(tarifa, tipoBifronte),
  }
}

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

export const formatPrecioMillar = (precio: number) => formatCop(precio)

export const formatUnidadMillar = (unidadMedida: number) =>
  new Intl.NumberFormat('es-CO').format(unidadMedida)
