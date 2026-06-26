import { useEffect } from 'react'
import { useOrdersStore } from '../stores/ordersStore.js'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import type { OrderStatus } from '../../core/domain/value-objects/OrderStatus'
import type { ProductionOrderStatus } from '../../core/domain/value-objects/ProductionOrderStatus'
import { PRODUCTION_STATUS_TO_PHASE } from '../../core/domain/policies/productionOrderStatusPolicy'
import { productionTraceRecorder } from '../services/productionTraceRecorder'
import { getAuthSessionSnapshot } from './useAuth'
import {
  OPERADOR_ASSIGNMENT_FIELDS,
  type ProductionAssignmentPhaseId,
} from '../features/production/utils/productionOperatorAssignment'

const container = Container.getInstance()

export const useOrdersHook = () => {
  const { orders, loading, error, setLoading, setOrders, addOrder, setError, updateOrder } =
    useOrdersStore()

  useEffect(() => {
    if (useOrdersStore.getState().orders.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:orders', () => container.getOrderUseCases().getOrders())
      .then(fetched => {
        if (!cancelled) setOrders(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando pedidos')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setOrders, setError])

  const createOrder = async (dto: unknown) => {
    setLoading(true)
    try {
      const order = await container.getOrderUseCases().createOrder(dto)
      addOrder(order)
      return order
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creando pedido'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (id: string, status: unknown) => {
    try {
      await container.getOrderUseCases().updateOrderStatus(id, status)
      const order = orders.find(o => o.id === id)
      if (order) {
        updateOrder({ ...order, status } as typeof order)
        const nextStatus = status as OrderStatus
        for (const phase of Object.keys(OPERADOR_ASSIGNMENT_FIELDS) as ProductionAssignmentPhaseId[]) {
          const fields = OPERADOR_ASSIGNMENT_FIELDS[phase]
          const userId = order.specs[fields.id] as string | undefined
          if (userId) {
            void productionTraceRecorder.recordOrderStatusChange({
              orderId: order.id,
              workName: order.workName,
              phase,
              userId,
              orderStatus: nextStatus,
            })
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error actualizando pedido'
      setError(message)
      throw err
    }
  }

  const updateProductionOrderStatus = async (id: string, status: ProductionOrderStatus) => {
    if (!id || id === 'new') {
      const message = 'Guarde la orden antes de cambiar su estado de producción'
      setError(message)
      throw new Error(message)
    }

    const session = getAuthSessionSnapshot()
    if (!session) {
      setError('No hay sesión activa')
      throw new Error('No hay sesión activa')
    }

    try {
      const updatedOrder = await container.getOrderUseCases().updateProductionOrderStatus(id, status, {
        userId: session.userId,
        permissions: session.permissions,
      })
      updateOrder(updatedOrder)

      const phase = PRODUCTION_STATUS_TO_PHASE[status] ?? 'preprensa'
      void productionTraceRecorder.recordProductionStatusChange({
        orderId: updatedOrder.id,
        workName: updatedOrder.workName,
        phase,
        userId: session.userId,
        productionStatus: status,
        orderStatus: updatedOrder.status,
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error actualizando estado de producción'
      setError(message)
      throw err
    }
  }

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
    updateProductionOrderStatus,
  }
}
