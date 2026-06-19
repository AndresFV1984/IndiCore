import type {
  ProductionTraceEvent,
  ProductionTraceFilter,
  RecordProductionTraceEventDTO,
  RegisterPartialDeliveryDTO,
  RegisterProductionPauseDTO,
  RegisterProductionResumeDTO,
} from '../../domain/entities/ProductionTrace'
import type { IProductionTraceUseCases } from '../../ports/in/IProductionTraceUseCases'
import type { IProductionTraceRepository } from '../../ports/out/IProductionTraceRepository'

const createId = (): string =>
  `trace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export class ProductionTraceUseCases implements IProductionTraceUseCases {
  constructor(private readonly repository: IProductionTraceRepository) {}

  async recordEvent(dto: RecordProductionTraceEventDTO): Promise<ProductionTraceEvent> {
    const event: ProductionTraceEvent = {
      id: createId(),
      orderId: dto.orderId,
      workName: dto.workName,
      phase: dto.phase,
      userId: dto.userId,
      type: dto.type,
      at: dto.at ?? new Date().toISOString(),
      orderStatus: dto.orderStatus,
      unidades: dto.unidades,
      nota: dto.nota,
      pauseReason: dto.pauseReason,
    }
    await this.repository.save(event)
    return event
  }

  async getEvents(filter?: ProductionTraceFilter): Promise<ProductionTraceEvent[]> {
    return this.repository.findAll(filter)
  }

  async registerPartialDelivery(dto: RegisterPartialDeliveryDTO): Promise<ProductionTraceEvent> {
    return this.recordEvent({
      orderId: dto.orderId,
      workName: dto.workName,
      phase: dto.phase,
      userId: dto.userId,
      type: 'entrega_parcial',
      orderStatus: dto.orderStatus,
      unidades: dto.unidades,
      nota: dto.nota,
    })
  }

  async registerPause(dto: RegisterProductionPauseDTO): Promise<ProductionTraceEvent> {
    return this.recordEvent({
      orderId: dto.orderId,
      workName: dto.workName,
      phase: dto.phase,
      userId: dto.userId,
      type: 'paro',
      orderStatus: dto.orderStatus,
      pauseReason: dto.pauseReason,
      nota: dto.nota,
    })
  }

  async registerResume(dto: RegisterProductionResumeDTO): Promise<ProductionTraceEvent> {
    return this.recordEvent({
      orderId: dto.orderId,
      workName: dto.workName,
      phase: dto.phase,
      userId: dto.userId,
      type: 'reanudacion',
      orderStatus: dto.orderStatus,
      nota: dto.nota,
    })
  }
}
