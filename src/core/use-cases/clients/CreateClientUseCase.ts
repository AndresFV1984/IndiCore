import { Client, CreateClientDTO } from '../../domain/entities/Client';
import { IClientRepository } from '../../ports/out/IClientRepository';

export class CreateClientUseCase {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(dto: CreateClientDTO): Promise<Client> {
    const client = Client.create(dto);
    await this.clientRepository.save(client);
    return client;
  }
}
