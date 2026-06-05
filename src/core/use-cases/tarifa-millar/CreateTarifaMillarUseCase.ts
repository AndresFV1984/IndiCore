import { TarifaMillar, CreateTarifaMillarDTO } from '../../domain/entities/TarifaMillar.js'
import { ITarifaMillarRepository } from '../../ports/out/ITarifaMillarRepository.js'

export class CreateTarifaMillarUseCase {
  constructor(private readonly repository: ITarifaMillarRepository) {}

  async execute(dto: CreateTarifaMillarDTO) {
    const item = TarifaMillar.create(dto)
    await this.repository.save(item)
    return item
  }
}
