import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import { CreateTamanoPlanchaDTO, TamanoPlancha } from '../../core/domain/entities/TamanoPlancha.js'
import { useTamanoPlanchaStore } from '../stores/tamanoPlanchaStore.js'

const container = Container.getInstance()

export const useTamanoPlanchaHook = () => {
  const { items, loading, error, setLoading, setItems, addItem, updateItem: patchItem, setError } =
    useTamanoPlanchaStore()

  useEffect(() => {
    if (useTamanoPlanchaStore.getState().items.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:tamano-plancha', () => container.getTamanoPlanchaUseCases().getTiposPlancha())
      .then(fetched => {
        if (!cancelled) setItems(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando tipos de plancha')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setItems, setError])

  const createTamanoPlancha = async (dto: CreateTamanoPlanchaDTO) => {
    const item = await container.getTamanoPlanchaUseCases().createTamanoPlancha(dto)
    addItem(item)
    return item
  }

  const updateTamanoPlancha = async (dto: CreateTamanoPlanchaDTO) => {
    if (!dto.id) throw new Error('ID requerido')
    const item = TamanoPlancha.create(dto)
    await container.getTamanoPlanchaUseCases().updateTamanoPlancha(item)
    patchItem(item)
    return item
  }

  return { items, loading, error, createTamanoPlancha, updateTamanoPlancha }
}
