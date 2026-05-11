import { Money } from '../value-objects/Money';

export type RemissionStatus = 'Pendiente' | 'Entregado' | 'Cancelado';

export class Remission {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly clientId: string,
    public readonly date: Date,
    public readonly items: RemissionItem[],
    public readonly observations: string,
    public readonly status: RemissionStatus,
    public readonly total: Money
  ) {}

  static create(dto: CreateRemissionDTO): Remission {
    const total = dto.items.reduce((sum, item) => sum.add(item.total), new Money(0));
    return new Remission(
      dto.id || crypto.randomUUID(),
      dto.orderId,
      dto.clientId,
      dto.date,
      dto.items,
      dto.observations,
      'Pendiente',
      total
    );
  }
}

export interface RemissionItem {
  product: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
}

export interface CreateRemissionDTO {
  id?: string;
  orderId: string;
  clientId: string;
  date: Date;
  items: RemissionItem[];
  observations: string;
}
