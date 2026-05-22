import { CreatePrecioMontajeDTO, PrecioMontaje } from '../../domain/entities/PrecioMontaje.js'

export interface IPrecioMontajeUseCases {
  createPrecioMontaje(dto: CreatePrecioMontajeDTO): Promise<PrecioMontaje>
  getPreciosMontaje(): Promise<PrecioMontaje[]>
  getPrecioMontajeById(id: string): Promise<PrecioMontaje | null>
  updatePrecioMontaje(item: PrecioMontaje): Promise<void>
  deletePrecioMontaje(id: string): Promise<void>
}
