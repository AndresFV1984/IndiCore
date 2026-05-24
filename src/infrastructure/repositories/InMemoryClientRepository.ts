import { Client } from '../../core/domain/entities/Client.js';
import { IClientRepository } from '../../core/ports/out/IClientRepository.js';
import { createClientSeeds } from '../seeds/gestionSeeds.js';

export class InMemoryClientRepository implements IClientRepository {
  private clients: Client[] = [];

  constructor() {
    this.seedData();
  }

  async findById(id: string): Promise<Client | null> {
    return this.clients.find(c => c.id === id) || null;
  }

  async findAll(): Promise<Client[]> {
    return [...this.clients];
  }

  async save(client: Client): Promise<void> {
    this.clients.push(client);
  }

  async update(client: Client): Promise<void> {
    const index = this.clients.findIndex(c => c.id === client.id);
    if (index !== -1) {
      this.clients[index] = client;
    }
  }

  async delete(id: string): Promise<void> {
    this.clients = this.clients.filter(c => c.id !== id);
  }

  private seedData(): void {
    this.clients = createClientSeeds();
  }
}
