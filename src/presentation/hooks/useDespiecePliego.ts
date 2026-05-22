import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import { CreateDespiecePliegoDTO, DespiecePliego } from '../../core/domain/entities/DespiecePliego.js'
import { useDespiecePliegoStore } from '../stores/despiecePliegoStore.js'

const container = Container.getInstance()

export const useDespiecePliegoHook = () => {
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
  } = useDespiecePliegoStore()

  useEffect(() => {
    if (useDespiecePliegoStore.getState().items.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:despiece-pliego', () =>
      container.getDespiecePliegoUseCases().getDespiecesPliego()
    )
      .then(fetched => {
        if (!cancelled) setItems(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando despieces')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setItems, setError])

  const createDespiecePliego = async (dto: CreateDespiecePliegoDTO) => {
    const item = await container.getDespiecePliegoUseCases().createDespiecePliego(dto)
    addItem(item)
    return item
  }

  const updateDespiecePliego = async (dto: CreateDespiecePliegoDTO) => {
    if (!dto.id) throw new Error('ID requerido')
    const item = DespiecePliego.create(dto)
    await container.getDespiecePliegoUseCases().updateDespiecePliego(item)
    updateItem(item)
    return item
  }

  const deleteDespiecePliego = async (id: string) => {
    await container.getDespiecePliegoUseCases().deleteDespiecePliego(id)
    removeItem(id)
  }

  return { items, loading, error, createDespiecePliego, updateDespiecePliego, deleteDespiecePliego }
}
