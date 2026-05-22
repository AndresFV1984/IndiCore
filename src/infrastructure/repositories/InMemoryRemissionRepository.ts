import { Remission } from '../../core/domain/entities/Remission';
import { IRemissionRepository } from '../../core/ports/out/IRemissionRepository';
import { Money } from '../../core/domain/value-objects/Money';
import { PURCHASE_ORDER_PREFIX } from '../../core/domain/value-objects/PurchaseOrderId.js';
import { REMISSION_PREFIX } from '../../core/domain/value-objects/RemissionId.js';

type RemissionSeed = {
  seq: number;
  clientId: string;
  orderSeq: number;
  description: string;
  date: Date;
  quantity: number;
  total: number;
  status: 'Pendiente' | 'Entregado' | 'Cancelado';
};

export class InMemoryRemissionRepository implements IRemissionRepository {
  private remissions: Remission[] = [];

  constructor() {
    this.seedData();
  }

  async findById(id: string): Promise<Remission | null> {
    return this.remissions.find(r => r.id === id) || null;
  }

  async findAll(): Promise<Remission[]> {
    return [...this.remissions].sort(
      (a, b) => parseRemissionSeq(b.id) - parseRemissionSeq(a.id)
    );
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
    const seeds: RemissionSeed[] = [
      { seq: 608, clientId: '2', orderSeq: 52, description: 'Etiquetas autoadhesivas', date: new Date(2026, 2, 10), quantity: 12, total: 890000, status: 'Entregado' },
      { seq: 612, clientId: '4', orderSeq: 48, description: 'Volantes promocionales', date: new Date(2026, 3, 2), quantity: 5, total: 420000, status: 'Entregado' },
      { seq: 615, clientId: '1', orderSeq: 55, description: 'Papa salvaje parcial', date: new Date(2026, 3, 15), quantity: 2, total: 350000, status: 'Entregado' },
      { seq: 616, clientId: '3', orderSeq: 51, description: 'Empaque retail display', date: new Date(2026, 3, 16), quantity: 8, total: 1250000, status: 'Entregado' },
      { seq: 617, clientId: '5', orderSeq: 49, description: 'Cajas corrugadas troqueladas', date: new Date(2026, 3, 18), quantity: 3, total: 620000, status: 'Entregado' },
      { seq: 618, clientId: '6', orderSeq: 53, description: 'Catálogo producto 2026', date: new Date(2026, 3, 20), quantity: 1, total: 2100000, status: 'Entregado' },
      { seq: 619, clientId: '7', orderSeq: 50, description: 'Stickers troquelados', date: new Date(2026, 3, 22), quantity: 15, total: 275000, status: 'Entregado' },
      { seq: 620, clientId: '8', orderSeq: 55, description: 'Papa salvaje parcial', date: new Date(2026, 3, 15), quantity: 2, total: 350000, status: 'Entregado' },
      { seq: 621, clientId: '2', orderSeq: 53, description: 'Cajas corrugadas', date: new Date(2026, 3, 24), quantity: 3, total: 620000, status: 'Entregado' },
      { seq: 622, clientId: '1', orderSeq: 54, description: 'Folletos punto de venta', date: new Date(2026, 3, 25), quantity: 6, total: 480000, status: 'Pendiente' },
      { seq: 605, clientId: '3', orderSeq: 45, description: 'Bolsa boutique laminada', date: new Date(2026, 1, 8), quantity: 4, total: 540000, status: 'Entregado' },
      { seq: 600, clientId: '4', orderSeq: 40, description: 'Insertos carta menú', date: new Date(2026, 0, 14), quantity: 10, total: 310000, status: 'Entregado' },
      { seq: 595, clientId: '5', orderSeq: 38, description: 'Display piso cartón', date: new Date(2025, 11, 20), quantity: 2, total: 980000, status: 'Entregado' },
      { seq: 590, clientId: '6', orderSeq: 35, description: 'Revista corporativa Q4', date: new Date(2025, 10, 5), quantity: 1, total: 3200000, status: 'Entregado' },
      { seq: 585, clientId: '7', orderSeq: 32, description: 'Etiquetas código barras', date: new Date(2025, 9, 12), quantity: 20, total: 195000, status: 'Cancelado' },
    ];

    for (const s of seeds) {
      const unit = Math.round(s.total / Math.max(s.quantity, 1));
      this.remissions.push(
        new Remission(
          `${REMISSION_PREFIX}${String(s.seq).padStart(3, '0')}`,
          `${PURCHASE_ORDER_PREFIX}${String(s.orderSeq).padStart(3, '0')}`,
          s.clientId,
          s.date,
          [
            {
              product: s.description,
              quantity: s.quantity,
              unitPrice: new Money(unit),
              total: new Money(s.total),
            },
          ],
          '',
          s.status,
          new Money(s.total)
        )
      );
    }
  }
}

function parseRemissionSeq(id: string): number {
  const match =
    id.match(/^OR-(\d+)$/i) ??
    id.match(/^REM-(\d+)$/i) ??
    id.match(/^remission-(\d+)$/i);
  return match ? parseInt(match[1], 10) : 0;
}
