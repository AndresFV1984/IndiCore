import { Order, CreateOrderDTO } from '../../domain/entities/Order';
import { OrderStatus } from '../../domain/value-objects/OrderStatus';
import type { ProductionOrderStatusActor } from '../../domain/policies/productionOrderStatusPolicy.js';
import type { ProductionOrderStatus } from '../../domain/value-objects/ProductionOrderStatus.js';

export interface IOrderUseCases {
  createOrder(dto: CreateOrderDTO): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
  updateProductionOrderStatus(
    id: string,
    status: ProductionOrderStatus,
    actor: ProductionOrderStatusActor
  ): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
}
