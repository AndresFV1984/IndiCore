import { Client } from '../domain/entities/Client';
import { IClientRepository } from '../domain/ports/out/IClientRepository';

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
    const seedClients = [
      { id: '1', name: 'Impresiones Bogotá S.A.', nit: '900123456-1', phone: '3001234567', city: 'Bogotá' },
      { id: '2', name: 'Litografía Medellín Ltda.', nit: '800234567-2', phone: '3012345678', city: 'Medellín' },
      { id: '3', name: 'Gráficas Cali E.U.', nit: '700345678-3', phone: '3023456789', city: 'Cali' },
      { id: '4', name: 'Imprenta Barranquilla SAS', nit: '600456789-4', phone: '3034567890', city: 'Barranquilla' },
      { id: '5', name: 'Cartón y Papel Cartagena', nit: '500567890-5', phone: '3045678901', city: 'Cartagena' },
      { id: '6', name: 'Diseños Bucaramanga S.A.', nit: '400678901-6', phone: '3056789012', city: 'Bucaramanga' },
      { id: '7', name: 'Etiquetas Pereira Ltda.', nit: '300789012-7', phone: '3067890123', city: 'Pereira' },
      { id: '8', name: 'Empaques Santa Marta E.U.', nit: '200890123-8', phone: '3078901234', city: 'Santa Marta' },
      { id: '9', name: 'Publicidad Cúcuta SAS', nit: '100901234-9', phone: '3089012345', city: 'Cúcuta' },
      { id: '10', name: 'Rotulación Ibagué', nit: '901012345-0', phone: '3090123456', city: 'Ibagué' },
    ];

    this.clients = seedClients.map(c => new Client(c.id, c.name, c.nit, c.phone, c.city, true));
  }
}
