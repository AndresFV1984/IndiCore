import { IOrderRepository } from '../core/ports/out/IOrderRepository';
import { IClientRepository } from '../core/ports/out/IClientRepository';
import { IRemissionRepository } from '../core/ports/out/IRemissionRepository';
import { IOrderUseCases } from '../core/ports/in/IOrderUseCases';
import { IClientUseCases } from '../core/ports/in/IClientUseCases';
import { IRemissionUseCases } from '../core/ports/in/IRemissionUseCases';

import { InMemoryOrderRepository } from '../infrastructure/repositories/InMemoryOrderRepository';
import { InMemoryClientRepository } from '../infrastructure/repositories/InMemoryClientRepository';
import { InMemoryRemissionRepository } from '../infrastructure/repositories/InMemoryRemissionRepository';

import { CreateOrderUseCase } from '../core/use-cases/orders/CreateOrderUseCase';
import { UpdateOrderStatusUseCase } from '../core/use-cases/orders/UpdateOrderStatusUseCase';
import { CreateClientUseCase } from '../core/use-cases/clients/CreateClientUseCase';

// Implement the use cases classes that implement the interfaces
class OrderUseCases implements IOrderUseCases {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly orderRepository: IOrderRepository
  ) {}

  async createOrder(dto: any): Promise<any> {
    return this.createOrderUseCase.execute(dto);
  }

  async getOrders(): Promise<any[]> {
    return this.orderRepository.findAll();
  }

  async getOrderById(id: string): Promise<any | null> {
    return this.orderRepository.findById(id);
  }

  async updateOrderStatus(id: string, status: any): Promise<void> {
    return this.updateOrderStatusUseCase.execute(id, status);
  }

  async deleteOrder(id: string): Promise<void> {
    return this.orderRepository.delete(id);
  }
}

class ClientUseCases implements IClientUseCases {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly clientRepository: IClientRepository
  ) {}

  async createClient(dto: any): Promise<any> {
    return this.createClientUseCase.execute(dto);
  }

  async getClients(): Promise<any[]> {
    return this.clientRepository.findAll();
  }

  async getClientById(id: string): Promise<any | null> {
    return this.clientRepository.findById(id);
  }

  async updateClient(client: any): Promise<void> {
    return this.clientRepository.update(client);
  }

  async deleteClient(id: string): Promise<void> {
    return this.clientRepository.delete(id);
  }
}

class RemissionUseCases implements IRemissionUseCases {
  constructor(private readonly remissionRepository: IRemissionRepository) {}

  async createRemission(dto: any): Promise<any> {
    // Placeholder
    return {} as any;
  }

  async getRemissions(): Promise<any[]> {
    return this.remissionRepository.findAll();
  }

  async getRemissionById(id: string): Promise<any | null> {
    return this.remissionRepository.findById(id);
  }

  async updateRemissionStatus(id: string, status: any): Promise<void> {
    // Placeholder
  }

  async deleteRemission(id: string): Promise<void> {
    return this.remissionRepository.delete(id);
  }
}

// Container
export class Container {
  private static instance: Container;

  private orderRepository: IOrderRepository;
  private clientRepository: IClientRepository;
  private remissionRepository: IRemissionRepository;

  private orderUseCases: IOrderUseCases;
  private clientUseCases: IClientUseCases;
  private remissionUseCases: IRemissionUseCases;

  private constructor() {
    this.orderRepository = new InMemoryOrderRepository();
    this.clientRepository = new InMemoryClientRepository();
    this.remissionRepository = new InMemoryRemissionRepository();

    this.orderUseCases = new OrderUseCases(
      new CreateOrderUseCase(this.orderRepository),
      new UpdateOrderStatusUseCase(this.orderRepository),
      this.orderRepository
    );

    this.clientUseCases = new ClientUseCases(
      new CreateClientUseCase(this.clientRepository),
      this.clientRepository
    );

    this.remissionUseCases = new RemissionUseCases(this.remissionRepository);
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  getOrderUseCases(): IOrderUseCases {
    return this.orderUseCases;
  }

  getClientUseCases(): IClientUseCases {
    return this.clientUseCases;
  }

  getRemissionUseCases(): IRemissionUseCases {
    return this.remissionUseCases;
  }
}
