import { DespiecePliego } from '../../domain/entities/DespiecePliego.js'

export interface IDespiecePliegoRepository {
  findById(id: string): Promise<DespiecePliego | null>
  findAll(): Promise<DespiecePliego[]>
  save(item: DespiecePliego): Promise<void>
  update(item: DespiecePliego): Promise<void>
  delete(id: string): Promise<void>
}
