import { PreprensaDisenoSpecs, YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'

/** Campos que se reinician al cambiar entre diseño nuevo y existente */
export function patchPreprensaDesignNuevo(value: YesNoChoice): Partial<PreprensaDisenoSpecs> {
  if (value === 'no') {
    return {
      designNuevo: 'no',
      nombreDiseno: '',
      disenoExistenteId: '',
      disenoExistenteNombre: '',
      aplicaCostoDiseno: false,
      crearDisenoCost: 0,
      designPdfFileName: '',
      numeroCavidades: 0,
      colores: '',
      coloresPlanchas: [],
      valorTotalPlanchas: 0,
      planchaId: '',
      planchaNombreMedida: '',
      planchaValor: 0,
      planchaClienteTipo: '',
      planchaNuevaCosto: 0,
      lineaTroquel: false,
      reservaUv: false,
      estampado: false,
      repuje: false,
      precioMontajeId: '',
      precioMontajeNombre: '',
      precioMontajeCosto: 0,
    }
  }
  return {
    designNuevo: 'si',
    disenoExistenteId: '',
    disenoExistenteNombre: '',
    planchaClienteTipo: '',
    planchaNuevaCosto: 0,
  }
}
