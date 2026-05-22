import { CortePapel } from '../../core/domain/entities/CortePapel.js'
import { ICortePapelRepository } from '../../core/ports/out/ICortePapelRepository.js'

export class InMemoryCortePapelRepository implements ICortePapelRepository {
  private items: CortePapel[] = []

  constructor() {
    this.seedData()
  }

  async findById(id: string): Promise<CortePapel | null> {
    return this.items.find(p => p.id === id) ?? null
  }

  async findAll(): Promise<CortePapel[]> {
    return [...this.items]
  }

  async save(item: CortePapel): Promise<void> {
    this.items.push(item)
  }

  async update(item: CortePapel): Promise<void> {
    const index = this.items.findIndex(p => p.id === item.id)
    if (index !== -1) this.items[index] = item
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter(p => p.id !== id)
  }

  private seedData(): void {
    this.items = [
      new CortePapel('cp-1', 'Corte etiqueta', '33', '48', 'cm', [
        { despieceId: 'dp-1', name: 'Etiqueta', ancho: '10', alto: '5', unidadMedida: 'cm', piezasPorPliego: 24 },
      ]),
      new CortePapel('cp-2', 'Corte tarjeta', '25', '35', 'cm', [
        { despieceId: 'dp-2', name: 'Tarjeta', ancho: '9', alto: '5', unidadMedida: 'cm', piezasPorPliego: 32 },
      ]),
      new CortePapel('cp-3', 'Corte flyer', '50', '70', 'cm', [
        { despieceId: 'dp-3', name: 'Flyer', ancho: '21', alto: '14.8', unidadMedida: 'cm', piezasPorPliego: 4 },
      ]),
      new CortePapel('cp-4', 'Corte invitación', '32', '45', 'cm', [
        { despieceId: 'dp-2', name: 'Tarjeta', ancho: '9', alto: '5', unidadMedida: 'cm', piezasPorPliego: 32 },
      ]),
      new CortePapel('cp-5', 'Corte packaging', '40', '55', 'cm', [
        { despieceId: 'dp-1', name: 'Etiqueta', ancho: '10', alto: '5', unidadMedida: 'cm', piezasPorPliego: 24 },
      ]),
    ]
  }
}
