import { DespiecePliego } from '../../core/domain/entities/DespiecePliego.js'
import { IDespiecePliegoRepository } from '../../core/ports/out/IDespiecePliegoRepository.js'

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
    this.items = [
      new DespiecePliego('dp-1', 'Etiqueta', '10', '5', 'cm', 24, true),
      new DespiecePliego('dp-2', 'Tarjeta', '9', '5', 'cm', 32, true),
      new DespiecePliego('dp-3', 'Flyer', '21', '14.8', 'cm', 4, true),
      new DespiecePliego('dp-4', 'Folder', '22', '28', 'cm', 2, false),
    ]
  }
}
