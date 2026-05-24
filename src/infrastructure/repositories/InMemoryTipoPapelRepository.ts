import { TipoPapel } from '../../core/domain/entities/TipoPapel.js'
import { ITipoPapelRepository } from '../../core/ports/out/ITipoPapelRepository.js'
import { createTipoPapelSeeds } from '../seeds/tipoPapelSeeds.js'

export class InMemoryTipoPapelRepository implements ITipoPapelRepository {
  private items: TipoPapel[] = []

  constructor() {
    this.seedData()
  }

  async findById(id: string): Promise<TipoPapel | null> {
    return this.items.find(p => p.id === id) ?? null
  }

  async findAll(): Promise<TipoPapel[]> {
    return [...this.items]
  }

  async save(item: TipoPapel): Promise<void> {
    this.items.push(item)
  }

  async update(item: TipoPapel): Promise<void> {
    const index = this.items.findIndex(p => p.id === item.id)
    if (index !== -1) this.items[index] = item
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter(p => p.id !== id)
  }

  private seedData(): void {
    this.items = createTipoPapelSeeds()
  }
}
