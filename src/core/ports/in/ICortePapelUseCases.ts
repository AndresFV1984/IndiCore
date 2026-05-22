import { CreateCortePapelDTO, CortePapel } from '../../domain/entities/CortePapel.js'

export interface ICortePapelUseCases {
  createCortePapel(dto: CreateCortePapelDTO): Promise<CortePapel>
  getCortesPapel(): Promise<CortePapel[]>
  getCortePapelById(id: string): Promise<CortePapel | null>
  updateCortePapel(item: CortePapel): Promise<void>
  deleteCortePapel(id: string): Promise<void>
}
