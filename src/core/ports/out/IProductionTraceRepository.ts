import type {
  ProductionTraceEvent,
  ProductionTraceFilter,
} from '../../domain/entities/ProductionTrace'

export interface IProductionTraceRepository {
  save(event: ProductionTraceEvent): Promise<void>
  findAll(filter?: ProductionTraceFilter): Promise<ProductionTraceEvent[]>
}
