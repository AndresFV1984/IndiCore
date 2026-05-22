import { OrderStatus } from '../../domain/value-objects/OrderStatus';
import { IOrderRepository } from '../../ports/out/IOrderRepository';

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(id: string, status: OrderStatus): Promise<void> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new Error('Order not found');
    const updatedOrder = order.updateStatus(status);
    await this.orderRepository.update(updatedOrder);
  }
}
