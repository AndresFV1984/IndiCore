import { TipoPapel, CreateTipoPapelDTO } from '../../domain/entities/TipoPapel.js'
import { ITipoPapelRepository } from '../../ports/out/ITipoPapelRepository.js'

export class CreateTipoPapelUseCase {
  constructor(private readonly repository: ITipoPapelRepository) {}

  async execute(dto: CreateTipoPapelDTO): Promise<TipoPapel> {
    const item = TipoPapel.create(dto)
    await this.repository.save(item)
    return item
  }
}
