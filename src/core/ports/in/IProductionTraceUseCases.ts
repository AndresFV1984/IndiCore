import type {
  ProductionTraceEvent,
  ProductionTraceFilter,
  RecordProductionTraceEventDTO,
  RegisterPartialDeliveryDTO,
  RegisterProductionPauseDTO,
  RegisterProductionResumeDTO,
} from '../../domain/entities/ProductionTrace'

export interface IProductionTraceUseCases {
  recordEvent(dto: RecordProductionTraceEventDTO): Promise<ProductionTraceEvent>
  getEvents(filter?: ProductionTraceFilter): Promise<ProductionTraceEvent[]>
  registerPartialDelivery(dto: RegisterPartialDeliveryDTO): Promise<ProductionTraceEvent>
  registerPause(dto: RegisterProductionPauseDTO): Promise<ProductionTraceEvent>
  registerResume(dto: RegisterProductionResumeDTO): Promise<ProductionTraceEvent>
}
