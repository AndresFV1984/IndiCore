import { PrecioMontaje } from '../../domain/entities/PrecioMontaje.js'
export interface IPrecioMontajeRepository { findById(id: string): Promise<PrecioMontaje | null>; findAll(): Promise<PrecioMontaje[]>; save(i: PrecioMontaje): Promise<void>; update(i: PrecioMontaje): Promise<void>; delete(id: string): Promise<void> }
