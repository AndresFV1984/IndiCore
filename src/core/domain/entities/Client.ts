export class Client {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly nit: string,
    public readonly phone: string,
    public readonly department: string,
    public readonly city: string,
    public readonly cityCode: string = '',
    public readonly active: boolean = true,
    public readonly address: string = '',
    public readonly email: string = '',
    public readonly contact: string = ''
  ) {}

  static create(dto: CreateClientDTO): Client {
    return new Client(
      dto.id || crypto.randomUUID(),
      dto.name,
      dto.nit ?? '',
      dto.phone ?? '',
      dto.department ?? '',
      dto.city ?? '',
      dto.cityCode ?? '',
      dto.active ?? true,
      dto.address ?? '',
      dto.email ?? '',
      dto.contact ?? ''
    );
  }
}

export interface CreateClientDTO {
  id?: string;
  name: string;
  nit?: string;
  phone?: string;
  department?: string;
  city?: string;
  cityCode?: string;
  active?: boolean;
  address?: string;
  email?: string;
  contact?: string;
}
