import { CortePapel } from '../../domain/entities/CortePapel.js'

export interface ICortePapelRepository {
  findById(id: string): Promise<CortePapel | null>
  findAll(): Promise<CortePapel[]>
  save(item: CortePapel): Promise<void>
  update(item: CortePapel): Promise<void>
  delete(id: string): Promise<void>
}
