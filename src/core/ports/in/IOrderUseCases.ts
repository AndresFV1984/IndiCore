import { Order, CreateOrderDTO } from '../../domain/entities/Order';
import { OrderStatus } from '../../domain/value-objects/OrderStatus';

export interface IOrderUseCases {
  createOrder(dto: CreateOrderDTO): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
  deleteOrder(id: string): Promise<void>;
}
