import { Order, CreateOrderDTO } from '../entities/Order';
import { OrderStatus } from '../value-objects/OrderStatus';

export interface IOrderUseCases {
  createOrder(dto: CreateOrderDTO): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
  deleteOrder(id: string): Promise<void>;
}
