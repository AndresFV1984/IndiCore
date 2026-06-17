import type { PreprensaDisenoSpecs } from '../../../../core/domain/entities/PreprensaDiseno'
import type { PrecioMontaje } from '../../../../core/domain/entities/PrecioMontaje'

export type PrecioMontajeSnapshot = Pick<
  PreprensaDisenoSpecs,
  'precioMontajeId' | 'precioMontajeNombre' | 'precioMontajeCosto'
>

/** Alinea el snapshot de montaje con el catálogo vigente cuando sea posible. */
export const reconcilePrecioMontajeSnapshot = (
  snapshot: PrecioMontajeSnapshot,
  catalog: PrecioMontaje[] = []
): PrecioMontajeSnapshot => {
  const id = snapshot.precioMontajeId.trim()
  const nombre = snapshot.precioMontajeNombre.trim()
  const costo = snapshot.precioMontajeCosto

  if (!id && !nombre && costo <= 0) {
    return { precioMontajeId: '', precioMontajeNombre: '', precioMontajeCosto: 0 }
  }

  const byId = id ? catalog.find(item => item.id === id) : undefined
  if (byId) {
    return {
      precioMontajeId: byId.id,
      precioMontajeNombre: byId.name,
      precioMontajeCosto: byId.cost,
    }
  }

  const byNameCost = catalog.find(
    item => item.state && item.name === nombre && item.cost === costo
  )
  if (byNameCost) {
    return {
      precioMontajeId: byNameCost.id,
      precioMontajeNombre: byNameCost.name,
      precioMontajeCosto: byNameCost.cost,
    }
  }

  return {
    precioMontajeId: id,
    precioMontajeNombre: nombre,
    precioMontajeCosto: costo,
  }
}

export type PrecioMontajePickerOption = {
  id: string
  label: string
  inactive?: boolean
  historial?: boolean
}

export const buildPrecioMontajePickerOptions = (
  catalog: PrecioMontaje[],
  snapshot: PrecioMontajeSnapshot
): {
  activeItems: PrecioMontaje[]
  options: PrecioMontajePickerOption[]
  selectedId: string
  displayName: string
  displayCost: number
  hasSelection: boolean
} => {
  const reconciled = reconcilePrecioMontajeSnapshot(snapshot, catalog)
  const activeItems = catalog.filter(item => item.state)
  const selectedId = reconciled.precioMontajeId
  const catalogMatch = selectedId ? catalog.find(item => item.id === selectedId) : undefined
  const activeMatch = selectedId ? activeItems.find(item => item.id === selectedId) : undefined

  const options: PrecioMontajePickerOption[] = activeItems.map(item => ({
    id: item.id,
    label: item.name,
  }))

  if (catalogMatch && !catalogMatch.state) {
    options.push({
      id: catalogMatch.id,
      label: catalogMatch.name,
      inactive: true,
    })
  } else if (
    selectedId &&
    !activeMatch &&
    reconciled.precioMontajeNombre &&
    !options.some(option => option.id === selectedId)
  ) {
    options.push({
      id: selectedId,
      label: reconciled.precioMontajeNombre,
      historial: true,
    })
  }

  const displayName = catalogMatch?.name ?? reconciled.precioMontajeNombre
  const displayCost = catalogMatch?.cost ?? reconciled.precioMontajeCosto
  const hasSelection = Boolean(selectedId && displayName)

  return {
    activeItems,
    options,
    selectedId,
    displayName,
    displayCost,
    hasSelection,
  }
}
