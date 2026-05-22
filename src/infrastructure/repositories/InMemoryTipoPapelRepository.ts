import { TipoPapel } from '../../core/domain/entities/TipoPapel.js'
import { ITipoPapelRepository } from '../../core/ports/out/ITipoPapelRepository.js'

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
    this.items = [
      new TipoPapel('papel-1', 'Couché brillante', '70', '100', 'cm', 1250, 'Resma 250 hojas', true),
      new TipoPapel('papel-2', 'Bond offset', '64', '90', 'cm', 890, 'Resma 500 hojas', true),
      new TipoPapel('papel-3', 'Cartulina sulfatada', '77', '110', 'cm', 2100, 'Paquete 100 hojas', true),
      new TipoPapel('papel-4', 'Papel kraft', '90', '120', 'cm', 650, 'Resma 200 hojas', false),
    ]
  }
}
