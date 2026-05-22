import { Client } from '../../core/domain/entities/Client.js';
import { IClientRepository } from '../../core/ports/out/IClientRepository.js';
import { resolveLocationFields } from '../../core/utils/colombiaLocations.js';

type ClientSeed = {
  id: string;
  name: string;
  nit: string;
  phone: string;
  city: string;
  email: string;
  department?: string;
  cityCode?: string;
};

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
    const seedClients: ClientSeed[] = [
      { id: '1', name: 'Impresiones Bogotá S.A.', nit: '900123456-1', phone: '3001234567', city: 'Bogotá D.C.', email: 'contacto@impresionesbogota.com' },
      { id: '2', name: 'Litografía Medellín Ltda.', nit: '800234567-2', phone: '3012345678', city: 'Medellín', email: 'info@litografiamedellin.com' },
      { id: '3', name: 'Gráficas Cali E.U.', nit: '700345678-3', phone: '3023456789', city: 'Cali', email: 'ventas@graficascali.com' },
      { id: '4', name: 'Imprenta Barranquilla SAS', nit: '600456789-4', phone: '3034567890', city: 'Barranquilla', email: 'pedidos@imprentabarranquilla.com' },
      { id: '5', name: 'Cartón y Papel Cartagena', nit: '500567890-5', phone: '3045678901', city: 'Cartagena', email: 'comercial@cartonpapel.com' },
      { id: '6', name: 'Diseños Bucaramanga S.A.', nit: '400678901-6', phone: '3056789012', city: 'Bucaramanga', email: 'hola@disenosbucaramanga.com' },
      { id: '7', name: 'Etiquetas Pereira Ltda.', nit: '300789012-7', phone: '3067890123', city: 'Pereira', email: 'etiquetas@pereira.com' },
      { id: '8', name: 'Empaques Santa Marta E.U.', nit: '200890123-8', phone: '3078901234', city: 'Santa Marta', email: 'empaques@santamarta.com' },
      { id: '9', name: 'Publicidad Cúcuta SAS', nit: '100901234-9', phone: '3089012345', city: 'Cúcuta', email: 'publicidad@cucuta.com' },
      { id: '10', name: 'Rotulación Ibagué', nit: '901012345-0', phone: '3090123456', city: 'Ibagué', email: 'rotulacion@ibague.com' },
    ];

    this.clients = seedClients.map(c => {
      const loc = c.department
        ? { department: c.department, city: c.city, cityCode: c.cityCode ?? '' }
        : resolveLocationFields(c.city);
      return new Client(
        c.id,
        c.name,
        c.nit,
        c.phone,
        loc.department,
        loc.city,
        loc.cityCode,
        true,
        '',
        c.email,
      );
    });
  }
}
