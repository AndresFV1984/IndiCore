import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import {
  CreateTarifaMillarDTO,
  TARIFA_MILLAR_UNIDAD,
  TarifaMillar,
} from '../../core/domain/entities/TarifaMillar.js'
import { useTarifaMillarStore } from '../stores/tarifaMillarStore.js'

const container = Container.getInstance()

export const useTarifaMillarHook = () => {
  const { items, loading, error, setLoading, setItems, addItem, updateItem, setError } =
    useTarifaMillarStore()

  useEffect(() => {
    const cached = useTarifaMillarStore.getState().items
    const hasLegacyVolteoNames = cached.some(
      item => item.name === 'Volteo de pinza' || item.name === 'Volteo de escuadra'
    )
    const cacheValid =
      cached.length > 0 &&
      !hasLegacyVolteoNames &&
      cached.every(
        item =>
          typeof item.unidadMedida === 'number' && item.unidadMedida === TARIFA_MILLAR_UNIDAD
      )
    if (cacheValid) return
    if (cached.length > 0) setItems([])

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:tarifas-millar:v3', () =>
      container.getTarifaMillarUseCases().getTarifasMillar()
    )
      .then(fetched => {
        if (!cancelled) setItems(fetched)
      })
      .catch(err => {
        if (!cancelled) setError(err.message || 'Error cargando tarifas por millar')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setLoading, setItems, setError])

  const createTarifaMillar = async (dto: CreateTarifaMillarDTO) => {
    const item = await container.getTarifaMillarUseCases().createTarifaMillar(dto)
    addItem(item)
    return item
  }

  const updateTarifaMillar = async (dto: CreateTarifaMillarDTO) => {
    if (!dto.id) throw new Error('ID requerido')
    const item = TarifaMillar.create(dto)
    await container.getTarifaMillarUseCases().updateTarifaMillar(item)
    updateItem(item)
    return item
  }

  return { items, loading, error, createTarifaMillar, updateTarifaMillar }
}
