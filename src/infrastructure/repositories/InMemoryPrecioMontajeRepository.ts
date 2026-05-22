import { PrecioMontaje } from '../../core/domain/entities/PrecioMontaje.js'
import { IPrecioMontajeRepository } from '../../core/ports/out/IPrecioMontajeRepository.js'
export class InMemoryPrecioMontajeRepository implements IPrecioMontajeRepository {
  private items = [
    new PrecioMontaje('pm-1', 'Montaje estándar 4 tintas', 85000, true),
    new PrecioMontaje('pm-2', 'Montaje complejo 6 tintas', 125000, true),
    new PrecioMontaje('pm-3', 'Montaje económico 2 tintas', 55000, true),
    new PrecioMontaje('pm-4', 'Montaje especial laminado', 158000, true),
  ]
  async findById(id: string) { return this.items.find(p => p.id === id) ?? null }
  async findAll() { return [...this.items] }
  async save(i: PrecioMontaje) { this.items.push(i) }
  async update(i: PrecioMontaje) { const x = this.items.findIndex(p => p.id === i.id); if (x >= 0) this.items[x] = i }
  async delete(id: string) { this.items = this.items.filter(p => p.id !== id) }
}
