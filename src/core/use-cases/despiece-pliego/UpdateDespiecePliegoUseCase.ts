import { CortePapel } from '../../domain/entities/CortePapel.js'
import { DespiecePliego } from '../../domain/entities/DespiecePliego.js'
import { TipoPapel } from '../../domain/entities/TipoPapel.js'
import { syncDespieceAsociadoList } from '../../domain/services/despiecePliegoCatalogSync.js'
import { ICortePapelRepository } from '../../ports/out/ICortePapelRepository.js'
import { IDespiecePliegoRepository } from '../../ports/out/IDespiecePliegoRepository.js'
import { ITipoPapelRepository } from '../../ports/out/ITipoPapelRepository.js'

export class UpdateDespiecePliegoUseCase {
  constructor(
    private readonly despiecePliegoRepository: IDespiecePliegoRepository,
    private readonly tipoPapelRepository: ITipoPapelRepository,
    private readonly cortePapelRepository: ICortePapelRepository
  ) {}

  async execute(item: DespiecePliego): Promise<void> {
    await this.despiecePliegoRepository.update(item)

    const tiposPapel = await this.tipoPapelRepository.findAll()
    for (const tipoPapel of tiposPapel) {
      if (!tipoPapel.despiecesPliego.some(d => d.despieceId === item.id)) continue

      await this.tipoPapelRepository.update(
        new TipoPapel(
          tipoPapel.id,
          tipoPapel.name,
          tipoPapel.ancho,
          tipoPapel.alto,
          tipoPapel.unidadMedida,
          tipoPapel.valorHoja,
          tipoPapel.unidadEmpaque,
          tipoPapel.valorCorte,
          tipoPapel.esmaltado,
          tipoPapel.active,
          syncDespieceAsociadoList(tipoPapel.despiecesPliego, item)
        )
      )
    }

    const cortesPapel = await this.cortePapelRepository.findAll()
    for (const cortePapel of cortesPapel) {
      if (!cortePapel.despieces.some(d => d.despieceId === item.id)) continue

      await this.cortePapelRepository.update(
        CortePapel.create({
          id: cortePapel.id,
          name: cortePapel.name,
          ancho: cortePapel.ancho,
          alto: cortePapel.alto,
          unidadMedida: cortePapel.unidadMedida,
          tipoPapelId: cortePapel.tipoPapelId,
          despieces: syncDespieceAsociadoList(cortePapel.despieces, item),
        })
      )
    }
  }
}
