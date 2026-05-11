import { Order } from '../domain/entities/Order';
import { IOrderRepository } from '../domain/ports/out/IOrderRepository';
import { Money } from '../domain/value-objects/Money';

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  constructor() {
    this.seedData();
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find(o => o.id === id) || null;
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders];
  }

  async save(order: Order): Promise<void> {
    this.orders.push(order);
  }

  async update(order: Order): Promise<void> {
    const index = this.orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      this.orders[index] = order;
    }
  }

  async delete(id: string): Promise<void> {
    this.orders = this.orders.filter(o => o.id !== id);
  }

  private seedData(): void {
    // Seed with 12-15 orders
    const clients = ['1', '2', '3', '4', '5', '6', '7', '8']; // Assuming client IDs
    const statuses: ('En curso' | 'Revisión' | 'Listo' | 'Entregado' | 'Cancelado')[] = ['En curso', 'Revisión', 'Listo', 'Entregado', 'Cancelado'];

    for (let i = 1; i <= 15; i++) {
      const order = new Order(
        `order-${i}`,
        clients[Math.floor(Math.random() * clients.length)],
        `Trabajo ${i}`,
        new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        {
          paperRows: [{ type: 'Papel 1', size: '90x64', cut: 'Corte 1' }],
          quantity: Math.floor(Math.random() * 1000) + 100,
          sheets: 100,
          leftover: 10,
          mounting: Math.random() > 0.5,
          mountingValue: new Money(50000),
          design: Math.random() > 0.5,
          plates: 2,
          platesValue: new Money(100000),
          thousands: 1,
          inks: '1x1',
          machineOutputValue: new Money(20000),
          chapoliado: Math.random() > 0.5,
          finishes: [],
          operations: []
        },
        statuses[Math.floor(Math.random() * statuses.length)],
        new Money(Math.floor(Math.random() * 1000000) + 100000)
      );
      this.orders.push(order);
    }
  }
}
