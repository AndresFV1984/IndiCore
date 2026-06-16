import type {
  DisenoColorPlanchaItem,
  PreprensaDisenoSpecs,
  YesNoChoice,
} from '../../../../core/domain/entities/PreprensaDiseno'
import {
  applyClienteSuministraPlanchaDetalleToItems,
  buildColoresPlanchasPatch,
  clearColoresPlanchasPrecios,
  type ColoresPlanchasPricingContext,
} from './coloresPlanchasUtils'

export function patchPreprensaClienteSuministraPlanchas(
  value: YesNoChoice,
  coloresPlanchas: DisenoColorPlanchaItem[],
  historialMode = false
): Partial<PreprensaDisenoSpecs> {
  const pricing: ColoresPlanchasPricingContext = {
    historialMode,
    clienteSuministraPlanchas: value,
  }
  const items =
    value === 'si'
      ? applyClienteSuministraPlanchaDetalleToItems(clearColoresPlanchasPrecios(coloresPlanchas))
      : coloresPlanchas
  return {
    clienteSuministraPlanchas: value,
    ...buildColoresPlanchasPatch(items, pricing),
  }
}
