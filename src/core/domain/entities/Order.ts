import { Money } from '../value-objects/Money.js';
import { OrderStatus } from '../value-objects/OrderStatus.js';
import { OrderTotalCalculator } from '../value-objects/OrderTotalCalculator.js';
import { PreprensaDisenoSpecs } from './PreprensaDiseno.js';

export interface OrderSpecs {
  paperRows: PaperRow[];
  quantity: number;
  sheets: number;
  leftover: number;
  mounting: boolean;
  mountingValue?: Money;
  design: boolean;
  preprensaDiseno: PreprensaDisenoSpecs;
  plates: number;
  platesValue: Money;
  thousands: number;
  inks: string;
  machineOutputValue: Money;
  chapoliado: boolean;
  finishes: FinishItem[];
  operations: OperationItem[];
}

export interface PaperRow {
  type: string;
  size: string;
  cut: string;
}

export interface FinishItem {
  name: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
}

export interface OperationItem {
  name: string;
  value: Money;
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly workName: string,
    public readonly date: Date,
    public readonly specs: OrderSpecs,
    public readonly status: OrderStatus,
    public readonly total: Money,
    public readonly vendedorId: string = ''
  ) {}

  static create(dto: CreateOrderDTO): Order {
    const total = OrderTotalCalculator.calculate(dto.specs);
    return new Order(
      dto.id || crypto.randomUUID(),
      dto.clientId,
      dto.workName,
      dto.date,
      dto.specs,
      'En curso',
      total,
      dto.vendedorId ?? ''
    );
  }

  updateStatus(newStatus: OrderStatus): Order {
    return new Order(
      this.id,
      this.clientId,
      this.workName,
      this.date,
      this.specs,
      newStatus,
      this.total,
      this.vendedorId
    );
  }
}

export interface CreateOrderDTO {
  id?: string;
  clientId: string;
  workName: string;
  date: Date;
  specs: OrderSpecs;
  vendedorId?: string;
}
