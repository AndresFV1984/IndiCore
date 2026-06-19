import type { ImpresionLadoTintas } from '../../../../core/domain/entities/Order'
import type { TarifaMillar } from '../../../../core/domain/entities/TarifaMillar'
import { TARIFA_COLOR_BASICO_NAME, TARIFA_PANTONE_NAME } from '../constants/impresionTarifaMillar'
import { DISENO_INK_PANTONE_INDEX } from '../constants/preprensaDisenoColors'
import {
  isImpresionEntradaDraftValid,
  isImpresionPantoneInkIndex,
  normalizeImpresionInkIndex,
} from './impresionTintasUtils'

export interface ImpresionTintasRegistroColorBasicoPatch {
  tarifaColorBasicoMillarId: string
  precioColorBasicoMillar: number
}

export interface ImpresionTintasRegistroPantonePatch {
  tarifaPantoneMillarId: string
  precioPantoneMillar: number
}

export type ImpresionTintasRegistroTarifasPatch = ImpresionTintasRegistroColorBasicoPatch &
  ImpresionTintasRegistroPantonePatch

export const isImpresionPrimaryOrSecondaryInkIndex = (value: number): boolean => {
  const normalized = normalizeImpresionInkIndex(value)
  return normalized >= 0 && normalized < DISENO_INK_PANTONE_INDEX
}

const collectEntradaInkIndices = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): number[] => [
  ...tiro.tintas.slice(0, tiro.cantidad),
  ...retiro.tintas.slice(0, retiro.cantidad),
]

const collectLadoInkIndices = (lado: ImpresionLadoTintas): number[] =>
  lado.tintas.slice(0, lado.cantidad).map(normalizeImpresionInkIndex)

export const ladoUsesPrimaryOrSecondaryInks = (lado: ImpresionLadoTintas): boolean =>
  collectLadoInkIndices(lado).some(isImpresionPrimaryOrSecondaryInkIndex)

export const ladoUsesPantoneInks = (lado: ImpresionLadoTintas): boolean =>
  collectLadoInkIndices(lado).some(isImpresionPantoneInkIndex)

export const entradaHasColorBasicoEnTiroYRetiro = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): boolean =>
  ladoUsesPrimaryOrSecondaryInks(tiro) && ladoUsesPrimaryOrSecondaryInks(retiro)

export const entradaHasPantoneEnTiroYRetiro = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): boolean => ladoUsesPantoneInks(tiro) && ladoUsesPantoneInks(retiro)

export const entradaUsesPrimaryOrSecondaryInks = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): boolean =>
  collectEntradaInkIndices(tiro, retiro).some(isImpresionPrimaryOrSecondaryInkIndex)

export const entradaUsesPantoneInks = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): boolean => collectEntradaInkIndices(tiro, retiro).some(isImpresionPantoneInkIndex)

export const shouldApplyColorBasicoTarifa = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  maxColores: number
): boolean =>
  isImpresionEntradaDraftValid(tiro, retiro, maxColores) &&
  entradaUsesPrimaryOrSecondaryInks(tiro, retiro)

export const shouldApplyPantoneTarifa = (
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  maxColores: number
): boolean =>
  isImpresionEntradaDraftValid(tiro, retiro, maxColores) && entradaUsesPantoneInks(tiro, retiro)

export const resolveTarifaColorBasicoMillar = (
  tarifas: TarifaMillar[]
): TarifaMillar | null => {
  const normalized = TARIFA_COLOR_BASICO_NAME.trim().toLowerCase()
  return (
    tarifas.find(item => item.state && item.name.trim().toLowerCase() === normalized) ?? null
  )
}

export const resolvePrecioColorBasicoMillarPatch = (
  tarifas: TarifaMillar[]
): ImpresionTintasRegistroColorBasicoPatch => {
  const tarifa = resolveTarifaColorBasicoMillar(tarifas)
  if (!tarifa) {
    return { tarifaColorBasicoMillarId: '', precioColorBasicoMillar: 0 }
  }
  return {
    tarifaColorBasicoMillarId: tarifa.id,
    precioColorBasicoMillar: tarifa.precio,
  }
}

export const resolveColorBasicoMillarPatchForEntrada = (
  tarifas: TarifaMillar[],
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  maxColores: number
): ImpresionTintasRegistroColorBasicoPatch =>
  shouldApplyColorBasicoTarifa(tiro, retiro, maxColores)
    ? resolvePrecioColorBasicoMillarPatch(tarifas)
    : { tarifaColorBasicoMillarId: '', precioColorBasicoMillar: 0 }

export const resolveTarifaPantoneMillar = (tarifas: TarifaMillar[]): TarifaMillar | null => {
  const normalized = TARIFA_PANTONE_NAME.trim().toLowerCase()
  return tarifas.find(item => item.state && item.name.trim().toLowerCase() === normalized) ?? null
}

export const resolvePrecioPantoneMillarPatch = (
  tarifas: TarifaMillar[]
): ImpresionTintasRegistroPantonePatch => {
  const tarifa = resolveTarifaPantoneMillar(tarifas)
  if (!tarifa) {
    return { tarifaPantoneMillarId: '', precioPantoneMillar: 0 }
  }
  return {
    tarifaPantoneMillarId: tarifa.id,
    precioPantoneMillar: tarifa.precio,
  }
}

export const resolvePantoneMillarPatchForEntrada = (
  tarifas: TarifaMillar[],
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  maxColores: number
): ImpresionTintasRegistroPantonePatch =>
  shouldApplyPantoneTarifa(tiro, retiro, maxColores)
    ? resolvePrecioPantoneMillarPatch(tarifas)
    : { tarifaPantoneMillarId: '', precioPantoneMillar: 0 }

export const resolveTintasMillarPatchForEntrada = (
  tarifas: TarifaMillar[],
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  maxColores: number
): ImpresionTintasRegistroTarifasPatch => ({
  ...resolveColorBasicoMillarPatchForEntrada(tarifas, tiro, retiro, maxColores),
  ...resolvePantoneMillarPatchForEntrada(tarifas, tiro, retiro, maxColores),
})

/** Precarga PRECIO cuando hay tintas del grupo asignadas (sin exigir plancha completa). */
export const resolveColorBasicoMillarPatchForDraft = (
  tarifas: TarifaMillar[],
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): ImpresionTintasRegistroColorBasicoPatch =>
  entradaUsesPrimaryOrSecondaryInks(tiro, retiro)
    ? resolvePrecioColorBasicoMillarPatch(tarifas)
    : { tarifaColorBasicoMillarId: '', precioColorBasicoMillar: 0 }

export const resolvePantoneMillarPatchForDraft = (
  tarifas: TarifaMillar[],
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): ImpresionTintasRegistroPantonePatch =>
  entradaUsesPantoneInks(tiro, retiro)
    ? resolvePrecioPantoneMillarPatch(tarifas)
    : { tarifaPantoneMillarId: '', precioPantoneMillar: 0 }

export const resolveTintasMillarPatchForDraft = (
  tarifas: TarifaMillar[],
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas
): ImpresionTintasRegistroTarifasPatch => ({
  ...resolveColorBasicoMillarPatchForDraft(tarifas, tiro, retiro),
  ...resolvePantoneMillarPatchForDraft(tarifas, tiro, retiro),
})
