import { CreateDespiecePliegoDTO, DespiecePliego } from '../../domain/entities/DespiecePliego.js'

export interface IDespiecePliegoUseCases {
  createDespiecePliego(dto: CreateDespiecePliegoDTO): Promise<DespiecePliego>
  getDespiecesPliego(): Promise<DespiecePliego[]>
  getDespiecePliegoById(id: string): Promise<DespiecePliego | null>
  updateDespiecePliego(item: DespiecePliego): Promise<void>
  deleteDespiecePliego(id: string): Promise<void>
}
