import { IOrderRepository } from '../core/ports/out/IOrderRepository.js';
import { IClientRepository } from '../core/ports/out/IClientRepository.js';
import { IRemissionRepository } from '../core/ports/out/IRemissionRepository.js';
import { IUserRepository } from '../core/ports/out/IUserRepository.js';
import { IVendedorRepository } from '../core/ports/out/IVendedorRepository.js';
import { IOrderUseCases } from '../core/ports/in/IOrderUseCases.js';
import { IClientUseCases } from '../core/ports/in/IClientUseCases.js';
import { IRemissionUseCases } from '../core/ports/in/IRemissionUseCases.js';
import { IUserUseCases } from '../core/ports/in/IUserUseCases.js';
import { IVendedorUseCases } from '../core/ports/in/IVendedorUseCases.js';
import { IPrecioMontajeUseCases } from '../core/ports/in/IPrecioMontajeUseCases.js';
import { ITamanoPlanchaUseCases } from '../core/ports/in/ITamanoPlanchaUseCases.js';
import { ITipoPapelUseCases } from '../core/ports/in/ITipoPapelUseCases.js';
import { IDespiecePliegoUseCases } from '../core/ports/in/IDespiecePliegoUseCases.js';
import { ICortePapelUseCases } from '../core/ports/in/ICortePapelUseCases.js';
import { IPrecioMontajeRepository } from '../core/ports/out/IPrecioMontajeRepository.js';

import { InMemoryOrderRepository } from '../infrastructure/repositories/InMemoryOrderRepository.js';
import { InMemoryClientRepository } from '../infrastructure/repositories/InMemoryClientRepository.js';
import { InMemoryRemissionRepository } from '../infrastructure/repositories/InMemoryRemissionRepository.js';

import { CreateOrderUseCase } from '../core/use-cases/orders/CreateOrderUseCase.js';
import { UpdateOrderStatusUseCase } from '../core/use-cases/orders/UpdateOrderStatusUseCase.js';
import { CreateClientUseCase } from '../core/use-cases/clients/CreateClientUseCase.js';
import { CreateUserUseCase } from '../core/use-cases/users/CreateUserUseCase.js';
import { InMemoryUserRepository } from '../infrastructure/repositories/InMemoryUserRepository.js';
import { CreateVendedorUseCase } from '../core/use-cases/vendedores/CreateVendedorUseCase.js';
import { InMemoryVendedorRepository } from '../infrastructure/repositories/InMemoryVendedorRepository.js';
import { CreatePrecioMontajeUseCase } from '../core/use-cases/precio-montaje/CreatePrecioMontajeUseCase.js';
import { CreateTamanoPlanchaUseCase } from '../core/use-cases/tamano-plancha/CreateTamanoPlanchaUseCase.js';
import { InMemoryPrecioMontajeRepository } from '../infrastructure/repositories/InMemoryPrecioMontajeRepository.js';
import { ITamanoPlanchaRepository } from '../core/ports/out/ITamanoPlanchaRepository.js';
import { InMemoryTamanoPlanchaRepository } from '../infrastructure/repositories/InMemoryTamanoPlanchaRepository.js';
import { ITipoPapelRepository } from '../core/ports/out/ITipoPapelRepository.js';
import { InMemoryTipoPapelRepository } from '../infrastructure/repositories/InMemoryTipoPapelRepository.js';
import { CreateTipoPapelUseCase } from '../core/use-cases/tipo-papel/CreateTipoPapelUseCase.js';
import { IDespiecePliegoRepository } from '../core/ports/out/IDespiecePliegoRepository.js';
import { InMemoryDespiecePliegoRepository } from '../infrastructure/repositories/InMemoryDespiecePliegoRepository.js';
import { CreateDespiecePliegoUseCase } from '../core/use-cases/despiece-pliego/CreateDespiecePliegoUseCase.js';
import { ICortePapelRepository } from '../core/ports/out/ICortePapelRepository.js';
import { InMemoryCortePapelRepository } from '../infrastructure/repositories/InMemoryCortePapelRepository.js';
import { CreateCortePapelUseCase } from '../core/use-cases/corte-papel/CreateCortePapelUseCase.js';

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

class UserUseCases implements IUserUseCases {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly userRepository: IUserRepository
  ) {}

  async createUser(dto: any): Promise<any> {
    return this.createUserUseCase.execute(dto);
  }

  async getUsers(): Promise<any[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<any | null> {
    return this.userRepository.findById(id);
  }

  async updateUser(user: any): Promise<void> {
    return this.userRepository.update(user);
  }

  async deleteUser(id: string): Promise<void> {
    return this.userRepository.delete(id);
  }
}

class VendedorUseCases implements IVendedorUseCases {
  constructor(
    private readonly createVendedorUseCase: CreateVendedorUseCase,
    private readonly vendedorRepository: IVendedorRepository
  ) {}

  async createVendedor(dto: any): Promise<any> {
    return this.createVendedorUseCase.execute(dto);
  }

  async getVendedores(): Promise<any[]> {
    return this.vendedorRepository.findAll();
  }

  async getVendedorById(id: string): Promise<any | null> {
    return this.vendedorRepository.findById(id);
  }

  async updateVendedor(vendedor: any): Promise<void> {
    return this.vendedorRepository.update(vendedor);
  }

  async deleteVendedor(id: string): Promise<void> {
    return this.vendedorRepository.delete(id);
  }
}

class PrecioMontajeUseCases implements IPrecioMontajeUseCases {
  constructor(
    private readonly createPrecioMontajeUseCase: CreatePrecioMontajeUseCase,
    private readonly precioMontajeRepository: IPrecioMontajeRepository
  ) {}

  async createPrecioMontaje(dto: any): Promise<any> {
    return this.createPrecioMontajeUseCase.execute(dto);
  }

  async getPreciosMontaje(): Promise<any[]> {
    return this.precioMontajeRepository.findAll();
  }

  async getPrecioMontajeById(id: string): Promise<any | null> {
    return this.precioMontajeRepository.findById(id);
  }

  async updatePrecioMontaje(precioMontaje: any): Promise<void> {
    return this.precioMontajeRepository.update(precioMontaje);
  }

  async deletePrecioMontaje(id: string): Promise<void> {
    return this.precioMontajeRepository.delete(id);
  }
}

class TamanoPlanchaUseCases implements ITamanoPlanchaUseCases {
  constructor(
    private readonly createTamanoPlanchaUseCase: CreateTamanoPlanchaUseCase,
    private readonly tamanoPlanchaRepository: ITamanoPlanchaRepository
  ) {}

  async createTamanoPlancha(dto: any): Promise<any> {
    return this.createTamanoPlanchaUseCase.execute(dto);
  }

  async getTiposPlancha(): Promise<any[]> {
    return this.tamanoPlanchaRepository.findAll();
  }

  async getTamanoPlanchaById(id: string): Promise<any | null> {
    return this.tamanoPlanchaRepository.findById(id);
  }

  async updateTamanoPlancha(item: any): Promise<void> {
    return this.tamanoPlanchaRepository.update(item);
  }

  async deleteTamanoPlancha(id: string): Promise<void> {
    return this.tamanoPlanchaRepository.delete(id);
  }
}

class TipoPapelUseCases implements ITipoPapelUseCases {
  constructor(
    private readonly createTipoPapelUseCase: CreateTipoPapelUseCase,
    private readonly tipoPapelRepository: ITipoPapelRepository
  ) {}

  async createTipoPapel(dto: any): Promise<any> {
    return this.createTipoPapelUseCase.execute(dto);
  }

  async getTiposPapel(): Promise<any[]> {
    return this.tipoPapelRepository.findAll();
  }

  async getTipoPapelById(id: string): Promise<any | null> {
    return this.tipoPapelRepository.findById(id);
  }

  async updateTipoPapel(item: any): Promise<void> {
    return this.tipoPapelRepository.update(item);
  }

  async deleteTipoPapel(id: string): Promise<void> {
    return this.tipoPapelRepository.delete(id);
  }
}

class DespiecePliegoUseCases implements IDespiecePliegoUseCases {
  constructor(
    private readonly createDespiecePliegoUseCase: CreateDespiecePliegoUseCase,
    private readonly despiecePliegoRepository: IDespiecePliegoRepository
  ) {}

  async createDespiecePliego(dto: any): Promise<any> {
    return this.createDespiecePliegoUseCase.execute(dto);
  }

  async getDespiecesPliego(): Promise<any[]> {
    return this.despiecePliegoRepository.findAll();
  }

  async getDespiecePliegoById(id: string): Promise<any | null> {
    return this.despiecePliegoRepository.findById(id);
  }

  async updateDespiecePliego(item: any): Promise<void> {
    return this.despiecePliegoRepository.update(item);
  }

  async deleteDespiecePliego(id: string): Promise<void> {
    return this.despiecePliegoRepository.delete(id);
  }
}

class CortePapelUseCases implements ICortePapelUseCases {
  constructor(
    private readonly createCortePapelUseCase: CreateCortePapelUseCase,
    private readonly cortePapelRepository: ICortePapelRepository
  ) {}

  async createCortePapel(dto: any): Promise<any> {
    return this.createCortePapelUseCase.execute(dto);
  }

  async getCortesPapel(): Promise<any[]> {
    return this.cortePapelRepository.findAll();
  }

  async getCortePapelById(id: string): Promise<any | null> {
    return this.cortePapelRepository.findById(id);
  }

  async updateCortePapel(item: any): Promise<void> {
    return this.cortePapelRepository.update(item);
  }

  async deleteCortePapel(id: string): Promise<void> {
    return this.cortePapelRepository.delete(id);
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
  private userRepository: IUserRepository;
  private vendedorRepository: IVendedorRepository;
  private precioMontajeRepository: IPrecioMontajeRepository;
  private tamanoPlanchaRepository: ITamanoPlanchaRepository;
  private tipoPapelRepository: ITipoPapelRepository;
  private despiecePliegoRepository: IDespiecePliegoRepository;
  private cortePapelRepository: ICortePapelRepository;

  private orderUseCases: IOrderUseCases;
  private clientUseCases: IClientUseCases;
  private remissionUseCases: IRemissionUseCases;
  private userUseCases: IUserUseCases;
  private vendedorUseCases: IVendedorUseCases;
  private precioMontajeUseCases: IPrecioMontajeUseCases;
  private tamanoPlanchaUseCases: ITamanoPlanchaUseCases;
  private tipoPapelUseCases: ITipoPapelUseCases;
  private despiecePliegoUseCases: IDespiecePliegoUseCases;
  private cortePapelUseCases: ICortePapelUseCases;

  private constructor() {
    this.orderRepository = new InMemoryOrderRepository();
    this.clientRepository = new InMemoryClientRepository();
    this.remissionRepository = new InMemoryRemissionRepository();
    this.userRepository = new InMemoryUserRepository();
    this.vendedorRepository = new InMemoryVendedorRepository();
    this.precioMontajeRepository = new InMemoryPrecioMontajeRepository();
    this.tamanoPlanchaRepository = new InMemoryTamanoPlanchaRepository();
    this.tipoPapelRepository = new InMemoryTipoPapelRepository();
    this.despiecePliegoRepository = new InMemoryDespiecePliegoRepository();
    this.cortePapelRepository = new InMemoryCortePapelRepository();

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

    this.userUseCases = new UserUseCases(
      new CreateUserUseCase(this.userRepository),
      this.userRepository
    );

    this.vendedorUseCases = new VendedorUseCases(
      new CreateVendedorUseCase(this.vendedorRepository),
      this.vendedorRepository
    );

    this.precioMontajeUseCases = new PrecioMontajeUseCases(
      new CreatePrecioMontajeUseCase(this.precioMontajeRepository),
      this.precioMontajeRepository
    );

    this.tamanoPlanchaUseCases = new TamanoPlanchaUseCases(
      new CreateTamanoPlanchaUseCase(this.tamanoPlanchaRepository),
      this.tamanoPlanchaRepository
    );

    this.tipoPapelUseCases = new TipoPapelUseCases(
      new CreateTipoPapelUseCase(this.tipoPapelRepository),
      this.tipoPapelRepository
    );

    this.despiecePliegoUseCases = new DespiecePliegoUseCases(
      new CreateDespiecePliegoUseCase(this.despiecePliegoRepository),
      this.despiecePliegoRepository
    );

    this.cortePapelUseCases = new CortePapelUseCases(
      new CreateCortePapelUseCase(this.cortePapelRepository),
      this.cortePapelRepository
    );
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

  getUserUseCases(): IUserUseCases {
    return this.userUseCases;
  }

  getVendedorUseCases(): IVendedorUseCases {
    return this.vendedorUseCases;
  }

  getPrecioMontajeUseCases(): IPrecioMontajeUseCases {
    return this.precioMontajeUseCases;
  }

  getTamanoPlanchaRepository(): ITamanoPlanchaRepository {
    return this.tamanoPlanchaRepository;
  }

  getTamanoPlanchaUseCases(): ITamanoPlanchaUseCases {
    return this.tamanoPlanchaUseCases;
  }

  getTipoPapelUseCases(): ITipoPapelUseCases {
    return this.tipoPapelUseCases;
  }

  getDespiecePliegoUseCases(): IDespiecePliegoUseCases {
    return this.despiecePliegoUseCases;
  }

  getCortePapelUseCases(): ICortePapelUseCases {
    return this.cortePapelUseCases;
  }
}
