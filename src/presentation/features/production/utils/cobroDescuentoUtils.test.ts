import { describe, expect, it } from 'vitest'
import { computeCobroDescuento } from './cobroDescuentoUtils'

describe('computeCobroDescuento', () => {
  it('no aplica descuento cuando el valor es cero', () => {
    const result = computeCobroDescuento({
      modo: 'porcentaje',
      valor: 0,
      subtotal: 500000,
    })

    expect(result).toEqual({
      descuentoAplicado: 0,
      totalConDescuento: 500000,
      hasDescuento: false,
    })
  })

  it('calcula descuento por porcentaje', () => {
    const result = computeCobroDescuento({
      modo: 'porcentaje',
      valor: 10,
      subtotal: 500000,
    })

    expect(result.descuentoAplicado).toBe(50000)
    expect(result.totalConDescuento).toBe(450000)
    expect(result.hasDescuento).toBe(true)
  })

  it('limita el porcentaje a 100', () => {
    const result = computeCobroDescuento({
      modo: 'porcentaje',
      valor: 150,
      subtotal: 200000,
    })

    expect(result.descuentoAplicado).toBe(200000)
    expect(result.totalConDescuento).toBe(0)
  })

  it('calcula descuento por valor fijo sin superar el subtotal', () => {
    const result = computeCobroDescuento({
      modo: 'valor',
      valor: 75000,
      subtotal: 500000,
    })

    expect(result.descuentoAplicado).toBe(75000)
    expect(result.totalConDescuento).toBe(425000)
  })

  it('no deja el total con descuento por debajo de cero', () => {
    const result = computeCobroDescuento({
      modo: 'valor',
      valor: 900000,
      subtotal: 500000,
    })

    expect(result.descuentoAplicado).toBe(500000)
    expect(result.totalConDescuento).toBe(0)
  })
})
