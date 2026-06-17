import {
  emptyPreprensaDiseno,
  PreprensaDisenoSpecs,
  YesNoChoice,
} from '../../../../core/domain/entities/PreprensaDiseno'

/** Hay datos de diseño que se perderían al cambiar entre nuevo y existente. */
export function preprensaDisenoHasRegisteredContent(diseno: PreprensaDisenoSpecs): boolean {
  if (diseno.nombreDiseno.trim()) return true
  if (diseno.aplicaCostoDiseno || diseno.crearDisenoCost > 0) return true
  if (diseno.designPdfFileName.trim()) return true
  if (diseno.coloresPlanchas.length > 0) return true
  if (diseno.disenoExistenteId.trim() || diseno.disenoExistenteNombre.trim()) return true
  if (diseno.clienteSuministraPlanchas === 'si') return true
  if (diseno.colores) return true
  if (diseno.planchaId.trim() || diseno.planchaNombreMedida.trim()) return true
  if (diseno.planchaValor > 0 || diseno.valorTotalPlanchas > 0) return true
  if (diseno.planchaClienteTipo || diseno.planchaNuevaCosto > 0) return true
  if (diseno.numeroCavidades > 0) return true
  if (diseno.lineaTroquel || diseno.reservaUv || diseno.estampado || diseno.repuje) return true
  if (diseno.precioMontajeId.trim() || diseno.precioMontajeCosto > 0) return true
  return false
}

/** Reinicia el formulario al cambiar entre diseño nuevo y existente. */
export function patchPreprensaDesignNuevo(value: YesNoChoice): Partial<PreprensaDisenoSpecs> {
  return {
    ...emptyPreprensaDiseno(),
    designNuevo: value,
  }
}
