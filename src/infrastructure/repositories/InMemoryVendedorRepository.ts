import { Vendedor } from '../../core/domain/entities/Vendedor.js'
import { IVendedorRepository } from '../../core/ports/out/IVendedorRepository.js'
import { createVendedorSeeds } from '../seeds/gestionSeeds.js'

export class InMemoryVendedorRepository implements IVendedorRepository {
  private vendedores: Vendedor[] = []

  constructor() {
    this.seedData()
  }

  async findById(id: string): Promise<Vendedor | null> {
    return this.vendedores.find(v => v.id === id) ?? null
  }

  async findAll(): Promise<Vendedor[]> {
    return [...this.vendedores]
  }

  async save(vendedor: Vendedor): Promise<void> {
    this.vendedores.push(vendedor)
  }

  async update(vendedor: Vendedor): Promise<void> {
    const index = this.vendedores.findIndex(v => v.id === vendedor.id)
    if (index !== -1) this.vendedores[index] = vendedor
  }

  async delete(id: string): Promise<void> {
    this.vendedores = this.vendedores.filter(v => v.id !== id)
  }

  private seedData(): void {
    this.vendedores = createVendedorSeeds()
  }
}
