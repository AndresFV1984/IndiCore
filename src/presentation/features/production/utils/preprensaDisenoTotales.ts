import { PreprensaDisenoSpecs } from '../../../../core/domain/entities/PreprensaDiseno'

export interface DisenoResumenTotales {
  costoDiseno: number
  valorTotalPlanchas: number
  precioMontaje: number
  totalDiseno: number
}

export const computeDisenoResumenTotales = (diseno: PreprensaDisenoSpecs): DisenoResumenTotales => {
  const costoDiseno = diseno.aplicaCostoDiseno ? diseno.crearDisenoCost : 0
  const valorTotalPlanchas = diseno.valorTotalPlanchas
  const precioMontaje = diseno.precioMontajeId.trim() ? diseno.precioMontajeCosto : 0
  return {
    costoDiseno,
    valorTotalPlanchas,
    precioMontaje,
    totalDiseno: costoDiseno + valorTotalPlanchas + precioMontaje,
  }
}
