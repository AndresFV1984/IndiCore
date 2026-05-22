import { TamanoPlancha, CreateTamanoPlanchaDTO } from '../../domain/entities/TamanoPlancha.js'
import { ITamanoPlanchaRepository } from '../../ports/out/ITamanoPlanchaRepository.js'
export class CreateTamanoPlanchaUseCase { constructor(private r: ITamanoPlanchaRepository) {} async execute(dto: CreateTamanoPlanchaDTO) { const i = TamanoPlancha.create(dto); await this.r.save(i); return i } }
