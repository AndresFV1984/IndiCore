import { Order, CreateOrderDTO } from '../../domain/entities/Order';
import { IOrderRepository } from '../../ports/out/IOrderRepository';
import { createNextPurchaseOrderId } from '../../domain/value-objects/PurchaseOrderId.js';

export class CreateOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(dto: CreateOrderDTO): Promise<Order> {
    const existing = await this.orderRepository.findAll();
    const id = dto.id ?? createNextPurchaseOrderId(existing.map(o => o.id));
    const order = Order.create({ ...dto, id });
    await this.orderRepository.save(order);
    return order;
  }
}
