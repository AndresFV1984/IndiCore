import { Order, CreateOrderDTO } from '../domain/entities/Order';
import { IOrderRepository } from '../domain/ports/out/IOrderRepository';

export class CreateOrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(dto: CreateOrderDTO): Promise<Order> {
    const order = Order.create(dto);
    await this.orderRepository.save(order);
    return order;
  }
}
