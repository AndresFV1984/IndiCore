import { CortePapel } from '../../core/domain/entities/CortePapel.js'
import { ICortePapelRepository } from '../../core/ports/out/ICortePapelRepository.js'
import { createCortePapelSeeds } from '../seeds/catalogSeeds.js'

export class InMemoryCortePapelRepository implements ICortePapelRepository {
  private items: CortePapel[] = []

  constructor() {
    this.seedData()
  }

  async findById(id: string): Promise<CortePapel | null> {
    return this.items.find(p => p.id === id) ?? null
  }

  async findAll(): Promise<CortePapel[]> {
    return [...this.items]
  }

  async save(item: CortePapel): Promise<void> {
    this.items.push(item)
  }

  async update(item: CortePapel): Promise<void> {
    const index = this.items.findIndex(p => p.id === item.id)
    if (index !== -1) this.items[index] = item
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter(p => p.id !== id)
  }

  private seedData(): void {
    this.items = createCortePapelSeeds()
  }
}
