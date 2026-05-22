import { DespiecePliego, CreateDespiecePliegoDTO } from '../../domain/entities/DespiecePliego.js'
import { IDespiecePliegoRepository } from '../../ports/out/IDespiecePliegoRepository.js'

export class CreateDespiecePliegoUseCase {
  constructor(private readonly repository: IDespiecePliegoRepository) {}

  async execute(dto: CreateDespiecePliegoDTO): Promise<DespiecePliego> {
    const item = DespiecePliego.create(dto)
    await this.repository.save(item)
    return item
  }
}
