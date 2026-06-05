import { TarifaMillar } from '../../core/domain/entities/TarifaMillar.js'
import { ITarifaMillarRepository } from '../../core/ports/out/ITarifaMillarRepository.js'
import { createTarifaMillarSeeds } from '../seeds/catalogSeeds.js'

export class InMemoryTarifaMillarRepository implements ITarifaMillarRepository {
  private items: TarifaMillar[] = []

  constructor() {
    this.items = createTarifaMillarSeeds()
  }

  async findById(id: string) {
    return this.items.find(item => item.id === id) ?? null
  }

  async findAll() {
    return [...this.items]
  }

  async save(item: TarifaMillar) {
    this.items.push(item)
  }

  async update(item: TarifaMillar) {
    const index = this.items.findIndex(current => current.id === item.id)
    if (index >= 0) this.items[index] = item
  }

  async delete(id: string) {
    this.items = this.items.filter(item => item.id !== id)
  }
}
