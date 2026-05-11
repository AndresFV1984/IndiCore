import { useEffect } from 'react'
import { useClients } from '../context/ClientsContext'
import { Container } from '../../di/container'

const container = Container.getInstance()

export const useClientsHook = () => {
  const { state, dispatch } = useClients()

  useEffect(() => {
    if (state.clients.length === 0) {
      container.getClientUseCases().getClients().then(clients => {
        dispatch({ type: 'SET_CLIENTS', payload: clients })
      }).catch(error => {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      })
    }
  }, [state.clients.length, dispatch])

  const createClient = async (dto: any) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const client = await container.getClientUseCases().createClient(dto)
      dispatch({ type: 'ADD_CLIENT', payload: client })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  return {
    clients: state.clients,
    loading: state.loading,
    error: state.error,
    createClient,
  }
}
