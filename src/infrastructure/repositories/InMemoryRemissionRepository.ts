import { Remission } from '../domain/entities/Remission';
import { IRemissionRepository } from '../domain/ports/out/IRemissionRepository';
import { Money } from '../domain/value-objects/Money';

export class InMemoryRemissionRepository implements IRemissionRepository {
  private remissions: Remission[] = [];

  constructor() {
    this.seedData();
  }

  async findById(id: string): Promise<Remission | null> {
    return this.remissions.find(r => r.id === id) || null;
  }

  async findAll(): Promise<Remission[]> {
    return [...this.remissions];
  }

  async save(remission: Remission): Promise<void> {
    this.remissions.push(remission);
  }

  async update(remission: Remission): Promise<void> {
    const index = this.remissions.findIndex(r => r.id === remission.id);
    if (index !== -1) {
      this.remissions[index] = remission;
    }
  }

  async delete(id: string): Promise<void> {
    this.remissions = this.remissions.filter(r => r.id !== id);
  }

  private seedData(): void {
    for (let i = 1; i <= 5; i++) {
      const remission = new Remission(
        `remission-${i}`,
        `order-${i}`,
        `client-${i % 10 + 1}`,
        new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        [
          {
            product: `Producto ${i}`,
            quantity: Math.floor(Math.random() * 100) + 10,
            unitPrice: new Money(Math.floor(Math.random() * 50000) + 10000),
            total: new Money(Math.floor(Math.random() * 100000) + 50000)
          }
        ],
        'Observaciones de prueba',
        'Pendiente',
        new Money(Math.floor(Math.random() * 200000) + 100000)
      );
      this.remissions.push(remission);
    }
  }
}
