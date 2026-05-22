import { Vendedor } from '../../core/domain/entities/Vendedor.js'
import { IVendedorRepository } from '../../core/ports/out/IVendedorRepository.js'
import { resolveLocationFields } from '../../core/utils/colombiaLocations.js'

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
    const seeds = [
      {
        id: 'vend-1',
        name: 'Carolina Méndez',
        document_type: 'CC' as const,
        identification_number: '52.384.901',
        city: 'Bogotá D.C.',
        address: 'Calle 72 # 10-34',
        mail: 'carolina.mendez@indicolors.com',
        contact: '310 555 1201',
      },
      {
        id: 'vend-2',
        name: 'Andrés Felipe Rojas',
        document_type: 'CC' as const,
        identification_number: '80.156.432',
        city: 'Medellín',
        address: 'Carrera 43A # 1-50',
        mail: 'andres.rojas@indicolors.com',
        contact: '320 555 3402',
      },
      {
        id: 'vend-3',
        name: 'Felipe Giraldo Osorio',
        document_type: 'CC' as const,
        identification_number: '1.098.234.567',
        city: 'Cali',
        address: 'Calle 5 # 14-22',
        mail: 'felipe.giraldo@indicolors.com',
        contact: '315 555 7803',
      },
      {
        id: 'vend-4',
        name: 'Valentina Restrepo',
        document_type: 'CC' as const,
        identification_number: '41.902.118',
        city: 'Pereira',
        address: 'Calle 19 # 8-42',
        mail: 'valentina.restrepo@indicolors.com',
        contact: '318 555 4404',
      },
      {
        id: 'vend-5',
        name: 'Santiago Muñoz',
        document_type: 'CC' as const,
        identification_number: '75.331.609',
        city: 'Cartagena',
        address: 'Bocagrande Cra. 3 # 8-120',
        mail: 'santiago.munoz@indicolors.com',
        contact: '300 555 5505',
      },
    ]

    this.vendedores = seeds.map(s => {
      const loc = resolveLocationFields(s.city)
      return new Vendedor(
        s.id,
        s.name,
        s.document_type,
        s.identification_number,
        loc.department,
        loc.city,
        loc.cityCode,
        s.address,
        s.mail,
        s.contact,
        true,
      )
    })
  }
}
