import {
  canSetProductionStatus,
  type ProductionOrderStatusActor,
} from '../../domain/policies/productionOrderStatusPolicy.js'
import type { Order } from '../../domain/entities/Order.js'
import type { ProductionOrderStatus } from '../../domain/value-objects/ProductionOrderStatus.js'
import type { IOrderRepository } from '../../ports/out/IOrderRepository.js'

export class UpdateProductionOrderStatusUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  async execute(input: {
    orderId: string
    status: ProductionOrderStatus
    actor: ProductionOrderStatusActor
  }): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId)
    if (!order) {
      throw new Error('Orden no encontrada')
    }

    const allowed = canSetProductionStatus(input.actor.permissions, input.status, {
      userId: input.actor.userId,
      specs: order.specs,
    })
    if (!allowed) {
      throw new Error('No tiene permiso para cambiar a este estado de producción')
    }

    const updatedOrder = order.updateProductionStatus(input.status)
    await this.orderRepository.update(updatedOrder)
    return updatedOrder
  }
}
