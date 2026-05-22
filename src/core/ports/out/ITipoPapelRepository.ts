import { TipoPapel } from '../../domain/entities/TipoPapel.js'

export interface ITipoPapelRepository {
  findById(id: string): Promise<TipoPapel | null>
  findAll(): Promise<TipoPapel[]>
  save(item: TipoPapel): Promise<void>
  update(item: TipoPapel): Promise<void>
  delete(id: string): Promise<void>
}
