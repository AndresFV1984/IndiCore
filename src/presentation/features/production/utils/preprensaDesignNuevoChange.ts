import {
  emptyPreprensaDiseno,
  PreprensaDisenoSpecs,
  YesNoChoice,
} from '../../../../core/domain/entities/PreprensaDiseno'

/** Reinicia el formulario al cambiar entre diseño nuevo y existente. */
export function patchPreprensaDesignNuevo(value: YesNoChoice): Partial<PreprensaDisenoSpecs> {
  return {
    ...emptyPreprensaDiseno(),
    designNuevo: value,
  }
}
