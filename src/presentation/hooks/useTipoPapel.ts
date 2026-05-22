import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import { CreateTipoPapelDTO, TipoPapel } from '../../core/domain/entities/TipoPapel.js'
import { useTipoPapelStore } from '../stores/tipoPapelStore.js'

const container = Container.getInstance()

export const useTipoPapelHook = () => {
  const { items, loading, error, setLoading, setItems, addItem, updateItem: patchItem, setError } =
    useTipoPapelStore()

  useEffect(() => {
    if (useTipoPapelStore.getState().items.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:tipo-papel', () => container.getTipoPapelUseCases().getTiposPapel())
      .then(fetched => {
        if (!cancelled) setItems(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando tipos de papel')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setItems, setError])

  const createTipoPapel = async (dto: CreateTipoPapelDTO) => {
    const item = await container.getTipoPapelUseCases().createTipoPapel(dto)
    addItem(item)
    return item
  }

  const updateTipoPapel = async (dto: CreateTipoPapelDTO) => {
    if (!dto.id) throw new Error('ID requerido')
    const item = TipoPapel.create(dto)
    await container.getTipoPapelUseCases().updateTipoPapel(item)
    patchItem(item)
    return item
  }

  return { items, loading, error, createTipoPapel, updateTipoPapel }
}
