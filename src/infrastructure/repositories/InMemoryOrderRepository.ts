import type { Order } from '../../core/domain/entities/Order.js'
import type { IOrderRepository } from '../../core/ports/out/IOrderRepository.js'
import { createProductionOrderSeeds } from '../seeds/productionOrderSeeds.js'

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Order[] = []

  constructor() {
    this.orders = createProductionOrderSeeds()
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find(o => o.id === id) || null
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders]
  }

  async save(order: Order): Promise<void> {
    this.orders.push(order)
  }

  async update(order: Order): Promise<void> {
    const index = this.orders.findIndex(o => o.id === order.id)
    if (index !== -1) {
      this.orders[index] = order
    }
  }

  async delete(id: string): Promise<void> {
    this.orders = this.orders.filter(o => o.id !== id)
  }
}
