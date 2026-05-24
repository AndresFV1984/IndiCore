import { TamanoPlancha } from '../../core/domain/entities/TamanoPlancha.js'
import { ITamanoPlanchaRepository } from '../../core/ports/out/ITamanoPlanchaRepository.js'
import { createTamanoPlanchaSeeds } from '../seeds/catalogSeeds.js'

export class InMemoryTamanoPlanchaRepository implements ITamanoPlanchaRepository {
  private items: TamanoPlancha[] = []

  constructor() {
    this.seedData()
  }

  async findById(id: string): Promise<TamanoPlancha | null> {
    return this.items.find(p => p.id === id) ?? null
  }

  async findAll(): Promise<TamanoPlancha[]> {
    return [...this.items]
  }

  async save(item: TamanoPlancha): Promise<void> {
    this.items.push(item)
  }

  async update(item: TamanoPlancha): Promise<void> {
    const index = this.items.findIndex(p => p.id === item.id)
    if (index !== -1) this.items[index] = item
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter(p => p.id !== id)
  }

  private seedData(): void {
    this.items = createTamanoPlanchaSeeds()
  }
}
