export class Client {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly nit: string,
    public readonly phone: string,
    public readonly city: string,
    public readonly active: boolean = true
  ) {}

  static create(dto: CreateClientDTO): Client {
    return new Client(
      dto.id || crypto.randomUUID(),
      dto.name,
      dto.nit,
      dto.phone,
      dto.city,
      dto.active
    );
  }
}

export interface CreateClientDTO {
  id?: string;
  name: string;
  nit: string;
  phone: string;
  city: string;
  active?: boolean;
}
