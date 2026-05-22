import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import { CreateVendedorDTO, Vendedor } from '../../core/domain/entities/Vendedor.js'
import { useVendedoresStore } from '../stores/vendedoresStore.js'

const container = Container.getInstance()

export const useVendedoresHook = () => {
  const {
    vendedores,
    loading,
    error,
    setLoading,
    setVendedores,
    addVendedor,
    updateVendedor: patchVendedor,
    setError,
  } = useVendedoresStore()

  useEffect(() => {
    if (useVendedoresStore.getState().vendedores.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:vendedores', () => container.getVendedorUseCases().getVendedores())
      .then(fetched => {
        if (!cancelled) setVendedores(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando vendedores')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setVendedores, setError])

  const createVendedor = async (dto: CreateVendedorDTO) => {
    try {
      const vendedor = await container.getVendedorUseCases().createVendedor(dto)
      addVendedor(vendedor)
      return vendedor
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creando vendedor'
      setError(message)
      throw err
    }
  }

  const updateVendedor = async (dto: CreateVendedorDTO) => {
    if (!dto.id) {
      const message = 'No se pudo identificar el vendedor a actualizar'
      setError(message)
      throw new Error(message)
    }
    try {
      const vendedor = Vendedor.create(dto)
      await container.getVendedorUseCases().updateVendedor(vendedor)
      patchVendedor(vendedor)
      return vendedor
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error actualizando vendedor'
      setError(message)
      throw err
    }
  }

  return { vendedores, loading, error, createVendedor, updateVendedor }
}
