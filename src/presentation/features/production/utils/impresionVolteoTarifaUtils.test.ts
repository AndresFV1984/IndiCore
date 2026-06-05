import { describe, expect, it } from 'vitest'
import { TarifaMillar } from '../../../../core/domain/entities/TarifaMillar'
import {
  formatPrecioMillar,
  formatUnidadMillar,
  resolvePrecioVolteoMillarPatch,
  resolveTarifaVolteoMillar,
} from './impresionVolteoTarifaUtils'

const tarifaPinza = new TarifaMillar(
  'tm-2',
  'Volteo por pinza',
  1000,
  20000,
  'Volteos',
  '',
  true
)

const tarifaEscuadra = new TarifaMillar(
  'tm-3',
  'Volteo por escuadra',
  1000,
  20000,
  'Volteos',
  '',
  true
)

describe('resolveTarifaVolteoMillar', () => {
  it('resuelve tarifa por pinza', () => {
    expect(
      resolveTarifaVolteoMillar([tarifaPinza, tarifaEscuadra], 'volteo-pinza')?.id
    ).toBe('tm-2')
  })

  it('resuelve tarifa por escuadra', () => {
    expect(
      resolveTarifaVolteoMillar([tarifaPinza, tarifaEscuadra], 'volteo-escuadra')?.id
    ).toBe('tm-3')
  })

  it('no resuelve cuando no hay volteo', () => {
    expect(resolveTarifaVolteoMillar([tarifaPinza], 'diferente-plancha')).toBeNull()
  })
})

describe('resolvePrecioVolteoMillarPatch', () => {
  it('limpia precio cuando no hay volteo', () => {
    expect(resolvePrecioVolteoMillarPatch([tarifaPinza], 'diferente-plancha')).toEqual({
      tarifaVolteoMillarId: '',
      precioVolteoMillar: 0,
    })
  })

  it('asigna precio de tarifa activa', () => {
    expect(resolvePrecioVolteoMillarPatch([tarifaPinza], 'volteo-pinza')).toEqual({
      tarifaVolteoMillarId: 'tm-2',
      precioVolteoMillar: 20000,
    })
  })
})

describe('formatPrecioMillar', () => {
  it('formatea solo el precio', () => {
    expect(formatPrecioMillar(20000)).toContain('20.000')
  })
})

describe('formatUnidadMillar', () => {
  it('formatea solo la unidad', () => {
    expect(formatUnidadMillar(1000)).toBe('1.000')
  })
})
