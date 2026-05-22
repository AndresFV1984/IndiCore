import { useEffect } from 'react'
import { useClientsStore } from '../stores/clientsStore.js'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import { Client, CreateClientDTO } from '../../core/domain/entities/Client.js'

const container = Container.getInstance()

export const useClientsHook = () => {
  const { clients, loading, error, setLoading, setClients, addClient, updateClient: patchClient, setError } = useClientsStore()

  useEffect(() => {
    if (useClientsStore.getState().clients.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:clients', () => container.getClientUseCases().getClients())
      .then(fetched => {
        if (!cancelled) setClients(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando clientes')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setClients, setError])

  const createClient = async (dto: CreateClientDTO) => {
    try {
      const client = await container.getClientUseCases().createClient(dto)
      addClient(client)
      return client
    } catch (error: any) {
      setError(error.message || 'Error creando cliente')
      throw error
    }
  }

  const updateClient = async (dto: CreateClientDTO) => {
    if (!dto.id) {
      const message = 'No se pudo identificar el cliente a actualizar'
      setError(message)
      throw new Error(message)
    }
    try {
      const client = Client.create(dto)
      await container.getClientUseCases().updateClient(client)
      patchClient(client)
      return client
    } catch (error: any) {
      setError(error.message || 'Error actualizando cliente')
      throw error
    }
  }

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
  }
}
