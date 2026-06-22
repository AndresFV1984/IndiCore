import { describe, expect, it } from 'vitest'
import type { ImpresionTintasRegistro } from '../../../../core/domain/entities/Order'
import {
  resolveClienteSuministraPruebaSherpa,
  resolvePrecioPruebaSherpaCobro,
} from './impresionPruebaSherpaUtils'

const registro = (
  patch: Partial<ImpresionTintasRegistro> = {}
): ImpresionTintasRegistro => ({
  colorPlanchaId: 'p1',
  entradas: [],
  ...patch,
})

describe('impresionPruebaSherpaUtils', () => {
  it('asume cliente cuando no hay selección explícita', () => {
    expect(resolveClienteSuministraPruebaSherpa(registro())).toBe('si')
  })

  it('no cobra cuando el cliente suministra la Prueba Sherpa', () => {
    expect(
      resolvePrecioPruebaSherpaCobro(
        registro({ clienteSuministraPruebaSherpa: 'si', precioPruebaSherpa: 50000 })
      )
    ).toBe(0)
  })

  it('expone el cobro cuando la litografía suministra', () => {
    expect(
      resolvePrecioPruebaSherpaCobro(
        registro({ clienteSuministraPruebaSherpa: 'no', precioPruebaSherpa: 85000 })
      )
    ).toBe(85000)
  })
})
