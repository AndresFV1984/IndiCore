import { Money } from '../value-objects/Money';
import { OrderStatus } from '../value-objects/OrderStatus';

export interface OrderSpecs {
  paperRows: PaperRow[];
  quantity: number;
  sheets: number;
  leftover: number;
  mounting: boolean;
  mountingValue?: Money;
  design: boolean;
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
    public readonly total: Money
  ) {}

  static create(dto: CreateOrderDTO): Order {
    const total = Order.calculateTotal(dto.specs);
    return new Order(
      dto.id || crypto.randomUUID(),
      dto.clientId,
      dto.workName,
      dto.date,
      dto.specs,
      'En curso',
      total
    );
  }

  private static calculateTotal(specs: OrderSpecs): Money {
    let total = new Money(0);

    // Add paper cut (assuming some calculation, for now placeholder)
    // total = total.add(specs.paperCutValue);

    if (specs.mounting && specs.mountingValue) {
      total = total.add(specs.mountingValue);
    }

    total = total.add(specs.platesValue);
    total = total.add(specs.machineOutputValue.multiply(specs.thousands));

    specs.finishes.forEach(finish => {
      total = total.add(finish.total);
    });

    specs.operations.forEach(op => {
      total = total.add(op.value);
    });

    return total;
  }

  updateStatus(newStatus: OrderStatus): Order {
    return new Order(
      this.id,
      this.clientId,
      this.workName,
      this.date,
      this.specs,
      newStatus,
      this.total
    );
  }
}

export interface CreateOrderDTO {
  id?: string;
  clientId: string;
  workName: string;
  date: Date;
  specs: OrderSpecs;
}
