import type {
  DisenoColorPlanchaItem,
  PreprensaDisenoSpecs,
  YesNoChoice,
} from '../../../../core/domain/entities/PreprensaDiseno'
import type { TamanoPlancha } from '../../../../core/domain/entities/TamanoPlancha'
import {
  applyClienteSuministraPlanchaDetalleToItems,
  applyLitografiaPlanchaDetalleToItems,
  buildColoresPlanchasPatch,
  deriveClienteSuministraPlanchasFromItems,
  restoreLitografiaPlanchaPreciosInItems,
  type ColoresPlanchasPricingContext,
} from './coloresPlanchasUtils'

export type PlanchaSuministroSelectorState = {
  visible: boolean
  disabledValues: YesNoChoice[]
}

/** Selector de suministro visible solo al crear o editar un registro. */
export function resolvePlanchaSuministroSelectorState(
  inRegistroComposer: boolean,
  _isEditingRegistro: boolean,
  _value: YesNoChoice
): PlanchaSuministroSelectorState {
  if (!inRegistroComposer) {
    return { visible: false, disabledValues: [] }
  }
  return { visible: true, disabledValues: [] }
}

/** Aplica suministro solo a un registro (crear / editar). */
export function patchRegistroClienteSuministraPlanchas(
  item: DisenoColorPlanchaItem,
  value: YesNoChoice,
  planchas: TamanoPlancha[] = [],
  historialMode = false
): DisenoColorPlanchaItem {
  const pricing: ColoresPlanchasPricingContext = {
    historialMode,
    clienteSuministraPlanchas: value,
  }
  const withFlag: DisenoColorPlanchaItem = { ...item, clienteSuministraPlanchas: value }
  if (value === 'si') {
    const [patched] = applyClienteSuministraPlanchaDetalleToItems([withFlag])
    return patched
  }
  const [detallePatched] = applyLitografiaPlanchaDetalleToItems([withFlag])
  const [restored] = restoreLitografiaPlanchaPreciosInItems(
    [detallePatched],
    planchas,
    pricing
  )
  return restored
}

/** Actualiza el indicador de orden sin modificar registros ya guardados. */
export function patchPreprensaClienteSuministraPlanchas(
  value: YesNoChoice,
  coloresPlanchas: DisenoColorPlanchaItem[],
  historialMode = false,
  _planchas: TamanoPlancha[] = []
): Partial<PreprensaDisenoSpecs> {
  return {
    clienteSuministraPlanchas: value,
    ...buildColoresPlanchasPatch(coloresPlanchas, { historialMode }),
  }
}

export function buildColoresPlanchasPatchWithSuministro(
  items: DisenoColorPlanchaItem[],
  historialMode = false
): Partial<PreprensaDisenoSpecs> {
  return {
    clienteSuministraPlanchas: deriveClienteSuministraPlanchasFromItems(items),
    ...buildColoresPlanchasPatch(items, { historialMode }),
  }
}
