import { CortePapel, CreateCortePapelDTO } from '../../domain/entities/CortePapel.js'
import { ICortePapelRepository } from '../../ports/out/ICortePapelRepository.js'

export class CreateCortePapelUseCase {
  constructor(private readonly repository: ICortePapelRepository) {}

  async execute(dto: CreateCortePapelDTO): Promise<CortePapel> {
    const item = CortePapel.create(dto)
    await this.repository.save(item)
    return item
  }
}
