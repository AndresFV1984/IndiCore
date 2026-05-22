import { Vendedor, CreateVendedorDTO } from '../../domain/entities/Vendedor.js'
import { IVendedorRepository } from '../../ports/out/IVendedorRepository.js'
export class CreateVendedorUseCase { constructor(private r: IVendedorRepository) {} async execute(dto: CreateVendedorDTO) { const v = Vendedor.create(dto); await this.r.save(v); return v } }
