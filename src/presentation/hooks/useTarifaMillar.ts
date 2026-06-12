import { useEffect } from 'react'
import { Container } from '../../di/container.js'
import { dedupedFetch } from '../utils/dedupedFetch.js'
import {
  CreateTarifaMillarDTO,
  DEFAULT_MILLAR_MINIMO_VENTA,
  DEFAULT_TOPE_MINIMO_MILLAR,
  TARIFA_MILLAR_UNIDAD,
  TarifaMillar,
} from '../../core/domain/entities/TarifaMillar.js'
import { useTarifaMillarStore } from '../stores/tarifaMillarStore.js'
import { isLegacyVolteoTarifaMillarRecord } from '../features/production/constants/impresionTarifaMillar.js'

const container = Container.getInstance()

export const useTarifaMillarHook = () => {
  const { items, loading, error, setLoading, setItems, addItem, updateItem, setError } =
    useTarifaMillarStore()

  useEffect(() => {
    const cached = useTarifaMillarStore.getState().items
    const hasLegacyVolteoRecords = cached.some(isLegacyVolteoTarifaMillarRecord)
    const hasStaleMillarPricingDefaults = cached.some(
      item =>
        item.millarMinimoVenta !== DEFAULT_MILLAR_MINIMO_VENTA ||
        item.topeMinimoMillar !== DEFAULT_TOPE_MINIMO_MILLAR
    )
    const cacheValid =
      cached.length > 0 &&
      !hasLegacyVolteoRecords &&
      !hasStaleMillarPricingDefaults &&
      cached.every(
        item =>
          typeof item.unidadMedida === 'number' &&
          item.unidadMedida === TARIFA_MILLAR_UNIDAD &&
          typeof item.millarMinimoVenta === 'number' &&
          typeof item.topeMinimoMillar === 'number' &&
          typeof item.umbralDecimalMillar === 'number' &&
          typeof item.precioVolteoPinza === 'number' &&
          typeof item.precioVolteoEscuadra === 'number'
      )
    if (cacheValid) return
    if (cached.length > 0) setItems([])

    let cancelled = false
    setLoading(true)
    dedupedFetch('store:tarifas-millar:v9', () =>
      container.getTarifaMillarUseCases().getTarifasMillar()
    )
      .then(fetched => {
        if (!cancelled) {
          setItems(fetched.filter(item => !isLegacyVolteoTarifaMillarRecord(item)))
        }
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
