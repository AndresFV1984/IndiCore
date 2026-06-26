import type { ImpresionTintasRegistro, ImpresionTipoBifronte } from '../../../../core/domain/entities/Order'
import type { TarifaMillar } from '../../../../core/domain/entities/TarifaMillar'
import { isImpresionConVolteo } from '../constants/impresionTipoBifronte'
import {
  resolveTintasMillarPatchForEntrada,
  shouldApplyColorBasicoTarifa,
  shouldApplyPantoneTarifa,
  type ImpresionTintasRegistroTarifasPatch,
} from './impresionColorBasicoTarifaUtils'
import type { ImpresionLadoTintas } from '../../../../core/domain/entities/Order'
import {
  resolveColorBasicoVolteoMillarPatch,
  resolvePantoneVolteoMillarPatch,
} from './impresionVolteoTarifaUtils'

export type ImpresionTintasDraftTarifa = Pick<
  ImpresionTintasRegistro,
  | 'tipoBifronteColorBasico'
  | 'tipoBifrontePantone'
  | 'tarifaColorBasicoMillarId'
  | 'precioColorBasicoMillar'
  | 'tarifaPantoneMillarId'
  | 'precioPantoneMillar'
  | 'tarifaVolteoColorBasicoMillarId'
  | 'precioVolteoColorBasicoMillar'
  | 'tarifaVolteoPantoneMillarId'
  | 'precioVolteoPantoneMillar'
>

export const emptyImpresionTintasDraftTarifa = (): ImpresionTintasDraftTarifa => ({
  tipoBifronteColorBasico: 'diferente-plancha',
  tipoBifrontePantone: 'diferente-plancha',
  tarifaColorBasicoMillarId: '',
  precioColorBasicoMillar: 0,
  tarifaPantoneMillarId: '',
  precioPantoneMillar: 0,
  tarifaVolteoColorBasicoMillarId: '',
  precioVolteoColorBasicoMillar: 0,
  tarifaVolteoPantoneMillarId: '',
  precioVolteoPantoneMillar: 0,
})

export const readImpresionTintasDraftTarifa = (
  registro: ImpresionTintasRegistro | null | undefined
): ImpresionTintasDraftTarifa => ({
  tipoBifronteColorBasico:
    registro?.tipoBifronteColorBasico ?? registro?.tipoBifronte ?? 'diferente-plancha',
  tipoBifrontePantone:
    registro?.tipoBifrontePantone ?? registro?.tipoBifronte ?? 'diferente-plancha',
  tarifaColorBasicoMillarId: registro?.tarifaColorBasicoMillarId ?? '',
  precioColorBasicoMillar: registro?.precioColorBasicoMillar ?? 0,
  tarifaPantoneMillarId: registro?.tarifaPantoneMillarId ?? '',
  precioPantoneMillar: registro?.precioPantoneMillar ?? 0,
  tarifaVolteoColorBasicoMillarId: registro?.tarifaVolteoColorBasicoMillarId ?? '',
  precioVolteoColorBasicoMillar: registro?.precioVolteoColorBasicoMillar ?? 0,
  tarifaVolteoPantoneMillarId: registro?.tarifaVolteoPantoneMillarId ?? '',
  precioVolteoPantoneMillar: registro?.precioVolteoPantoneMillar ?? 0,
})

export const syncImpresionTintasDraftTarifa = (
  prev: ImpresionTintasDraftTarifa,
  tarifas: TarifaMillar[],
  tiro: ImpresionLadoTintas,
  retiro: ImpresionLadoTintas,
  maxColores: number
): ImpresionTintasDraftTarifa => {
  const usesColorBasico = shouldApplyColorBasicoTarifa(tiro, retiro, maxColores)
  const usesPantone = shouldApplyPantoneTarifa(tiro, retiro, maxColores)
  const basePatch: ImpresionTintasRegistroTarifasPatch =
    usesColorBasico || usesPantone
      ? resolveTintasMillarPatchForEntrada(tarifas, tiro, retiro, maxColores)
      : {
          tarifaColorBasicoMillarId: '',
          precioColorBasicoMillar: 0,
          tarifaPantoneMillarId: '',
          precioPantoneMillar: 0,
        }

  const tipoCb = usesColorBasico ? prev.tipoBifronteColorBasico : 'diferente-plancha'
  const tipoPt = usesPantone ? prev.tipoBifrontePantone : 'diferente-plancha'
  const volteoCb = isImpresionConVolteo(tipoCb)
    ? resolveColorBasicoVolteoMillarPatch(tarifas, tipoCb)
    : { tarifaVolteoColorBasicoMillarId: '', precioVolteoColorBasicoMillar: 0 }
  const volteoPt = isImpresionConVolteo(tipoPt)
    ? resolvePantoneVolteoMillarPatch(tarifas, tipoPt)
    : { tarifaVolteoPantoneMillarId: '', precioVolteoPantoneMillar: 0 }

  return {
    tipoBifronteColorBasico: tipoCb,
    tipoBifrontePantone: tipoPt,
    ...basePatch,
    ...volteoCb,
    ...volteoPt,
  }
}

export const patchImpresionTintasDraftTarifaVolteo = (
  prev: ImpresionTintasDraftTarifa,
  tarifas: TarifaMillar[],
  variant: 'colorBasico' | 'pantone',
  tipoBifronte: ImpresionTipoBifronte | ''
): ImpresionTintasDraftTarifa => {
  if (variant === 'colorBasico') {
    const tipo = (tipoBifronte || 'diferente-plancha') as ImpresionTipoBifronte
    return {
      ...prev,
      tipoBifronteColorBasico: tipo,
      ...resolveColorBasicoVolteoMillarPatch(tarifas, tipo),
    }
  }
  const tipo = (tipoBifronte || 'diferente-plancha') as ImpresionTipoBifronte
  return {
    ...prev,
    tipoBifrontePantone: tipo,
    ...resolvePantoneVolteoMillarPatch(tarifas, tipo),
  }
}
