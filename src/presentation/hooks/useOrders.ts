import { useEffect } from 'react'
import { useOrders } from '../context/OrdersContext'
import { Container } from '../../di/container'

const container = Container.getInstance()

export const useOrdersHook = () => {
  const { state, dispatch } = useOrders()

  useEffect(() => {
    if (state.orders.length === 0) {
      container.getOrderUseCases().getOrders().then(orders => {
        dispatch({ type: 'SET_ORDERS', payload: orders })
      }).catch(error => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      })
    }
  }, [state.orders.length, dispatch])

  const createOrder = async (dto: any) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const order = await container.getOrderUseCases().createOrder(dto)
      dispatch({ type: 'ADD_ORDER', payload: order })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const updateOrderStatus = async (id: string, status: any) => {
    try {
      await container.getOrderUseCases().updateOrderStatus(id, status)
      const order = state.orders.find(o => o.id === id)
      if (order) {
        dispatch({ type: 'UPDATE_ORDER', payload: { ...order, status } })
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    }
  }

  return {
    orders: state.orders,
    loading: state.loading,
    error: state.error,
    createOrder,
    updateOrderStatus,
  }
}
