import { TamanoPlancha } from '../../domain/entities/TamanoPlancha.js'

export interface ITamanoPlanchaRepository {
  findById(id: string): Promise<TamanoPlancha | null>
  findAll(): Promise<TamanoPlancha[]>
  save(item: TamanoPlancha): Promise<void>
  update(item: TamanoPlancha): Promise<void>
  delete(id: string): Promise<void>
}
