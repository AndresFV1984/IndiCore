import { TarifaMillar } from '../../domain/entities/TarifaMillar.js'

export interface ITarifaMillarRepository {
  findById(id: string): Promise<TarifaMillar | null>
  findAll(): Promise<TarifaMillar[]>
  save(item: TarifaMillar): Promise<void>
  update(item: TarifaMillar): Promise<void>
  delete(id: string): Promise<void>
}
