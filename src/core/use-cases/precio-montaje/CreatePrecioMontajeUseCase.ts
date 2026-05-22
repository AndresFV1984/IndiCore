import { PrecioMontaje, CreatePrecioMontajeDTO } from '../../domain/entities/PrecioMontaje.js'
import { IPrecioMontajeRepository } from '../../ports/out/IPrecioMontajeRepository.js'
export class CreatePrecioMontajeUseCase { constructor(private r: IPrecioMontajeRepository) {} async execute(dto: CreatePrecioMontajeDTO) { const i = PrecioMontaje.create(dto); await this.r.save(i); return i } }
