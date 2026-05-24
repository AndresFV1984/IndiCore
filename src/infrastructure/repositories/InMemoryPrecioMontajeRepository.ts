import { PrecioMontaje } from '../../core/domain/entities/PrecioMontaje.js'
import { IPrecioMontajeRepository } from '../../core/ports/out/IPrecioMontajeRepository.js'
import { createPrecioMontajeSeeds } from '../seeds/catalogSeeds.js'

export class InMemoryPrecioMontajeRepository implements IPrecioMontajeRepository {
  private items: PrecioMontaje[] = []

  constructor() {
    this.items = createPrecioMontajeSeeds()
  }

  async findById(id: string) {
    return this.items.find(p => p.id === id) ?? null
  }

  async findAll() {
    return [...this.items]
  }

  async save(i: PrecioMontaje) {
    this.items.push(i)
  }

  async update(i: PrecioMontaje) {
    const x = this.items.findIndex(p => p.id === i.id)
    if (x >= 0) this.items[x] = i
  }

  async delete(id: string) {
    this.items = this.items.filter(p => p.id !== id)
  }
}
