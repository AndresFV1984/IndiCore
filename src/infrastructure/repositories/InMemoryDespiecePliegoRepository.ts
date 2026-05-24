import { DespiecePliego } from '../../core/domain/entities/DespiecePliego.js'
import { IDespiecePliegoRepository } from '../../core/ports/out/IDespiecePliegoRepository.js'
import { createDespiecePliegoSeeds } from '../seeds/catalogSeeds.js'

export class InMemoryDespiecePliegoRepository implements IDespiecePliegoRepository {
  private items: DespiecePliego[] = []

  constructor() {
    this.seedData()
  }

  async findById(id: string): Promise<DespiecePliego | null> {
    return this.items.find(p => p.id === id) ?? null
  }

  async findAll(): Promise<DespiecePliego[]> {
    return [...this.items]
  }

  async save(item: DespiecePliego): Promise<void> {
    this.items.push(item)
  }

  async update(item: DespiecePliego): Promise<void> {
    const index = this.items.findIndex(p => p.id === item.id)
    if (index !== -1) this.items[index] = item
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter(p => p.id !== id)
  }

  private seedData(): void {
    this.items = createDespiecePliegoSeeds()
  }
}
