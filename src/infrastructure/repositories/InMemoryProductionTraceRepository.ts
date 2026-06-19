import type {
  ProductionTraceEvent,
  ProductionTraceFilter,
} from '../../core/domain/entities/ProductionTrace'
import type { IProductionTraceRepository } from '../../core/ports/out/IProductionTraceRepository'
import { createProductionTraceSeeds } from '../seeds/productionTraceSeeds'

export class InMemoryProductionTraceRepository implements IProductionTraceRepository {
  private events: ProductionTraceEvent[] = []

  constructor() {
    this.events = createProductionTraceSeeds()
  }

  async save(event: ProductionTraceEvent): Promise<void> {
    this.events.push(event)
  }

  async findAll(filter?: ProductionTraceFilter): Promise<ProductionTraceEvent[]> {
    let result = [...this.events]
    if (filter?.userId) {
      result = result.filter(event => event.userId === filter.userId)
    }
    if (filter?.orderId) {
      result = result.filter(event => event.orderId === filter.orderId)
    }
    if (filter?.phase) {
      result = result.filter(event => event.phase === filter.phase)
    }
    if (filter?.from) {
      const fromMs = Date.parse(filter.from)
      result = result.filter(event => Date.parse(event.at) >= fromMs)
    }
    if (filter?.to) {
      const toMs = Date.parse(filter.to)
      result = result.filter(event => Date.parse(event.at) <= toMs)
    }
    return result.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  }
}
