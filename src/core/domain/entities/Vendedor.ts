import type { DocumentType } from './User'

export class Vendedor {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly document_type: DocumentType,
    public readonly identification_number: string,
    public readonly department: string,
    public readonly city: string,
    public readonly cityCode: string,
    public readonly address: string,
    public readonly mail: string,
    public readonly contact: string,
    public readonly state: boolean = true
  ) {}

  static create(dto: CreateVendedorDTO) {
    return new Vendedor(
      dto.id || crypto.randomUUID(),
      dto.name,
      dto.document_type,
      dto.identification_number,
      dto.department ?? '',
      dto.city ?? '',
      dto.cityCode ?? '',
      dto.address ?? '',
      dto.mail,
      dto.contact ?? '',
      dto.state ?? true
    )
  }
}

export interface CreateVendedorDTO {
  id?: string
  name: string
  document_type: DocumentType
  identification_number: string
  department?: string
  city?: string
  cityCode?: string
  address?: string
  mail: string
  contact?: string
  state?: boolean
}
