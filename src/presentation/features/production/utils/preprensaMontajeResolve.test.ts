import { describe, expect, it } from 'vitest'
import { PrecioMontaje } from '../../../../core/domain/entities/PrecioMontaje'
import {
  buildPrecioMontajePickerOptions,
  reconcilePrecioMontajeSnapshot,
} from './preprensaMontajeResolve'

const catalog = [
  new PrecioMontaje('m1', 'Montaje estándar', 120000, true),
  new PrecioMontaje('m2', 'Montaje especial', 180000, false),
]

describe('reconcilePrecioMontajeSnapshot', () => {
  it('vincula por id cuando la tarifa sigue en catálogo', () => {
    expect(
      reconcilePrecioMontajeSnapshot(
        {
          precioMontajeId: 'm1',
          precioMontajeNombre: 'Viejo',
          precioMontajeCosto: 1,
        },
        catalog
      )
    ).toEqual({
      precioMontajeId: 'm1',
      precioMontajeNombre: 'Montaje estándar',
      precioMontajeCosto: 120000,
    })
  })

  it('vincula por nombre y costo si falta el id', () => {
    expect(
      reconcilePrecioMontajeSnapshot(
        {
          precioMontajeId: '',
          precioMontajeNombre: 'Montaje estándar',
          precioMontajeCosto: 120000,
        },
        catalog
      )
    ).toEqual({
      precioMontajeId: 'm1',
      precioMontajeNombre: 'Montaje estándar',
      precioMontajeCosto: 120000,
    })
  })
})

describe('buildPrecioMontajePickerOptions', () => {
  it('incluye tarifa inactiva del catálogo para mantener la selección', () => {
    const result = buildPrecioMontajePickerOptions(catalog, {
      precioMontajeId: 'm2',
      precioMontajeNombre: 'Montaje especial',
      precioMontajeCosto: 180000,
    })
    expect(result.selectedId).toBe('m2')
    expect(result.hasSelection).toBe(true)
    expect(result.options.some(option => option.id === 'm2' && option.inactive)).toBe(true)
  })

  it('incluye opción de trabajo anterior si la tarifa ya no está en catálogo', () => {
    const result = buildPrecioMontajePickerOptions(catalog, {
      precioMontajeId: 'legacy',
      precioMontajeNombre: 'Montaje histórico',
      precioMontajeCosto: 90000,
    })
    expect(result.options.some(option => option.id === 'legacy' && option.historial)).toBe(true)
    expect(result.displayCost).toBe(90000)
  })
})
