import { Container } from '../../di/container'
import type { OrderStatus } from '../../../core/domain/value-objects/OrderStatus'
import type {
  ProductionTracePauseReasonId,
  ProductionTracePhaseId,
} from '../../../core/domain/entities/ProductionTrace'
import type { ProductionAssignmentPhaseId } from '../features/production/utils/productionOperatorAssignment'

const container = Container.getInstance()

export const productionTraceRecorder = {
  async recordAssignment(input: {
    orderId: string
    workName: string
    phase: ProductionAssignmentPhaseId
    userId: string
    orderStatus?: OrderStatus
  }) {
    const trace = container.getProductionTraceUseCases()
    await trace.recordEvent({
      orderId: input.orderId,
      workName: input.workName,
      phase: input.phase,
      userId: input.userId,
      type: 'asignacion',
      orderStatus: input.orderStatus,
    })
  },

  async recordOrderStatusChange(input: {
    orderId: string
    workName: string
    phase: ProductionTracePhaseId
    userId: string
    orderStatus: OrderStatus
  }) {
    const trace = container.getProductionTraceUseCases()
    await trace.recordEvent({
      orderId: input.orderId,
      workName: input.workName,
      phase: input.phase,
      userId: input.userId,
      type: 'cambio_estado_orden',
      orderStatus: input.orderStatus,
    })
  },

  async recordPartialDelivery(input: {
    orderId: string
    workName: string
    phase: ProductionTracePhaseId
    userId: string
    unidades: number
    orderStatus?: OrderStatus
    nota?: string
  }) {
    const trace = container.getProductionTraceUseCases()
    await trace.registerPartialDelivery(input)
  },

  async recordUnitsProgress(input: {
    orderId: string
    workName: string
    phase: ProductionTracePhaseId
    userId: string
    unidades: number
    orderStatus?: OrderStatus
    nota?: string
  }) {
    const trace = container.getProductionTraceUseCases()
    await trace.recordEvent({
      ...input,
      type: 'avance_unidades',
    })
  },

  async recordPause(input: {
    orderId: string
    workName: string
    phase: ProductionTracePhaseId
    userId: string
    pauseReason: ProductionTracePauseReasonId
    orderStatus?: OrderStatus
    nota?: string
  }) {
    const trace = container.getProductionTraceUseCases()
    await trace.registerPause(input)
  },

  async recordResume(input: {
    orderId: string
    workName: string
    phase: ProductionTracePhaseId
    userId: string
    orderStatus?: OrderStatus
    nota?: string
  }) {
    const trace = container.getProductionTraceUseCases()
    await trace.registerResume(input)
  },
}
