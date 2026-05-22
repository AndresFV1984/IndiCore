import { Client, CreateClientDTO } from '../../domain/entities/Client';

export interface IClientUseCases {
  createClient(dto: CreateClientDTO): Promise<Client>;
  getClients(): Promise<Client[]>;
  getClientById(id: string): Promise<Client | null>;
  updateClient(client: Client): Promise<void>;
  deleteClient(id: string): Promise<void>;
}
