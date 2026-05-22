import { CreateVendedorDTO, Vendedor } from '../../domain/entities/Vendedor.js'

export interface IVendedorUseCases {
  createVendedor(dto: CreateVendedorDTO): Promise<Vendedor>
  getVendedores(): Promise<Vendedor[]>
  getVendedorById(id: string): Promise<Vendedor | null>
  updateVendedor(vendedor: Vendedor): Promise<void>
  deleteVendedor(id: string): Promise<void>
}
