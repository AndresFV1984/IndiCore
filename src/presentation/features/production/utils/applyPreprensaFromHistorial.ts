import {
  emptyPreprensaDiseno,
  PreprensaDisenoSpecs,
} from '../../../../core/domain/entities/PreprensaDiseno'
import {
  applyColoresPlanchasForHistorialReuse,
  buildColoresPlanchasPatch,
  normalizeColoresPlanchas,
} from './coloresPlanchasUtils'

export const normalizePreprensaSnapshot = (
  raw?: Partial<PreprensaDisenoSpecs>
): PreprensaDisenoSpecs => {
  const base: PreprensaDisenoSpecs = {
    ...emptyPreprensaDiseno(),
    ...raw,
  }
  const coloresPlanchas = normalizeColoresPlanchas(base)
  const clienteSuministraPlanchas = base.clienteSuministraPlanchas ?? 'no'
  return {
    ...base,
    clienteSuministraPlanchas,
    ...buildColoresPlanchasPatch(coloresPlanchas, {
      clienteSuministraPlanchas,
    }),
  }
}

export const resolveDisplayNombreDiseno = (prep: PreprensaDisenoSpecs): string =>
  prep.nombreDiseno?.trim() || prep.disenoExistenteNombre?.trim() || ''

/** Aplica al formulario actual los datos de preprensa guardados en una orden anterior. */
export function buildPreprensaFromHistorial(
  sourceRaw: PreprensaDisenoSpecs | undefined,
  sourceOrderId: string,
  workName = ''
): Partial<PreprensaDisenoSpecs> {
  const source = normalizePreprensaSnapshot(sourceRaw)
  const nombreDiseno =
    resolveDisplayNombreDiseno(source) || workName.trim() || ''

  return {
    designNuevo: 'no',
    disenoExistenteId: sourceOrderId,
    disenoExistenteNombre: nombreDiseno,
    nombreDiseno,
    aplicaCostoDiseno: source.aplicaCostoDiseno,
    crearDisenoCost: source.crearDisenoCost,
    designPdfFileName: source.designPdfFileName,
    planchaClienteTipo: source.planchaClienteTipo,
    planchaNuevaCosto: source.planchaNuevaCosto,
    numeroCavidades: source.numeroCavidades,
    colores: source.colores,
    ...buildColoresPlanchasPatch(
      applyColoresPlanchasForHistorialReuse(sourceRaw ?? source)
    ),
    lineaTroquel: source.lineaTroquel,
    reservaUv: source.reservaUv,
    estampado: source.estampado,
    repuje: source.repuje,
    precioMontajeId: source.precioMontajeId,
    precioMontajeNombre: source.precioMontajeNombre,
    precioMontajeCosto: source.precioMontajeCosto,
  }
}

export const clearPreprensaHistorialSelection = (): Partial<PreprensaDisenoSpecs> => ({
  disenoExistenteId: '',
  disenoExistenteNombre: '',
  nombreDiseno: '',
  aplicaCostoDiseno: false,
  crearDisenoCost: 0,
  designPdfFileName: '',
  planchaClienteTipo: '',
  planchaNuevaCosto: 0,
  numeroCavidades: 0,
  colores: '',
  coloresPlanchas: [],
  valorTotalPlanchas: 0,
  planchaId: '',
  planchaNombreMedida: '',
  planchaValor: 0,
  lineaTroquel: false,
  reservaUv: false,
  estampado: false,
  repuje: false,
  precioMontajeId: '',
  precioMontajeNombre: '',
  precioMontajeCosto: 0,
})
