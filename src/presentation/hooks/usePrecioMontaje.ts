import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import { CreatePrecioMontajeDTO, PrecioMontaje } from '../../core/domain/entities/PrecioMontaje.js'
import { usePrecioMontajeStore } from '../stores/precioMontajeStore.js'

const container = Container.getInstance()

export const usePrecioMontajeHook = () => {
  const { items, loading, error, setLoading, setItems, addItem, updateItem: patchItem, setError } =
    usePrecioMontajeStore()

  useEffect(() => {
    if (usePrecioMontajeStore.getState().items.length > 0) return

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:precio-montaje', () => container.getPrecioMontajeUseCases().getPreciosMontaje())
      .then(fetched => {
        if (!cancelled) setItems(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando precios de montaje')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setItems, setError])

  const createPrecioMontaje = async (dto: CreatePrecioMontajeDTO) => {
    const item = await container.getPrecioMontajeUseCases().createPrecioMontaje(dto)
    addItem(item)
    return item
  }

  const updatePrecioMontaje = async (dto: CreatePrecioMontajeDTO) => {
    if (!dto.id) throw new Error('ID requerido')
    const item = PrecioMontaje.create(dto)
    await container.getPrecioMontajeUseCases().updatePrecioMontaje(item)
    patchItem(item)
    return item
  }

  return { items, loading, error, createPrecioMontaje, updatePrecioMontaje }
}
