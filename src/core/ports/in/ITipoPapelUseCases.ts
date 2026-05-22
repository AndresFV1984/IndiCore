import { CreateTipoPapelDTO, TipoPapel } from '../../domain/entities/TipoPapel.js'

export interface ITipoPapelUseCases {
  createTipoPapel(dto: CreateTipoPapelDTO): Promise<TipoPapel>
  getTiposPapel(): Promise<TipoPapel[]>
  getTipoPapelById(id: string): Promise<TipoPapel | null>
  updateTipoPapel(item: TipoPapel): Promise<void>
  deleteTipoPapel(id: string): Promise<void>
}
