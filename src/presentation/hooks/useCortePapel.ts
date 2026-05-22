import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import { CreateCortePapelDTO, CortePapel } from '../../core/domain/entities/CortePapel.js'
import { useCortePapelStore } from '../stores/cortePapelStore.js'

const container = Container.getInstance()

export const useCortePapelHook = () => {
  const {
    items,
    loading,
    error,
    setLoading,
    setItems,
    addItem,
    updateItem,
    removeItem,
    setError,
  } = useCortePapelStore()

  useEffect(() => {
    if (useCortePapelStore.getState().items.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:corte-papel', () => container.getCortePapelUseCases().getCortesPapel())
      .then(fetched => {
        if (!cancelled) setItems(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando cortes de papel')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setItems, setError])

  const createCortePapel = async (dto: CreateCortePapelDTO) => {
    const item = await container.getCortePapelUseCases().createCortePapel(dto)
    addItem(item)
    return item
  }

  const updateCortePapel = async (dto: CreateCortePapelDTO) => {
    if (!dto.id) throw new Error('ID requerido')
    const item = CortePapel.create(dto)
    await container.getCortePapelUseCases().updateCortePapel(item)
    updateItem(item)
    return item
  }

  const deleteCortePapel = async (id: string) => {
    await container.getCortePapelUseCases().deleteCortePapel(id)
    removeItem(id)
  }

  return { items, loading, error, createCortePapel, updateCortePapel, deleteCortePapel }
}
