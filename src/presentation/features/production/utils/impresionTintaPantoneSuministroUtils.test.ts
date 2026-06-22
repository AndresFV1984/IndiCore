import { describe, expect, it } from 'vitest'
import type { ImpresionTintasRegistro } from '../../../../core/domain/entities/Order'
import {
  resolveClienteSuministraTintaPantone,
  resolvePrecioCobroTintaPantone,
} from './impresionTintaPantoneSuministroUtils'

const registro = (
  patch: Partial<ImpresionTintasRegistro> = {}
): ImpresionTintasRegistro => ({
  colorPlanchaId: 'p1',
  entradas: [],
  ...patch,
})

describe('impresionTintaPantoneSuministroUtils', () => {
  it('asume cliente cuando no hay selección explícita', () => {
    expect(resolveClienteSuministraTintaPantone(registro())).toBe('si')
  })

  it('no cobra cuando el cliente entrega la tinta Pantone', () => {
    expect(
      resolvePrecioCobroTintaPantone(
        registro({ clienteSuministraTintaPantone: 'si', precioCobroTintaPantone: 40000 })
      )
    ).toBe(0)
  })

  it('expone el cobro cuando la litografía suministra', () => {
    expect(
      resolvePrecioCobroTintaPantone(
        registro({ clienteSuministraTintaPantone: 'no', precioCobroTintaPantone: 120000 })
      )
    ).toBe(120_000)
  })
})
