import { useEffect } from 'react'
import { useOrdersStore } from '../stores/ordersStore.js'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'

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
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error actualizando pedido'
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
  }
}
