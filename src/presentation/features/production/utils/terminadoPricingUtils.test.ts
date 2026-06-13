import { describe, expect, it } from 'vitest'
import {
  applyTerminadoCostoMinimo,
  computeTerminadoAreaFactor,
  computeTerminadoPrecio,
} from './terminadoPricingUtils'

describe('computeTerminadoAreaFactor', () => {
  it('calcula (ancho/100) × (alto/100)', () => {
    expect(computeTerminadoAreaFactor('10', '5')).toBeCloseTo(0.005)
    expect(computeTerminadoAreaFactor('21', '14,8')).toBeCloseTo(0.03108)
  })
})

describe('applyTerminadoCostoMinimo', () => {
  it('usa costo mínimo cuando el calculado es menor', () => {
    expect(applyTerminadoCostoMinimo(1200, 18000)).toBe(18000)
  })

  it('conserva el calculado cuando es igual o mayor al mínimo', () => {
    expect(applyTerminadoCostoMinimo(25000, 18000)).toBe(25000)
    expect(applyTerminadoCostoMinimo(18000, 18000)).toBe(18000)
  })
})

describe('computeTerminadoPrecio', () => {
  it('aplica la fórmula completa con costo mínimo', () => {
    const result = computeTerminadoPrecio('10', '5', 100, 2500, 18000)
    expect(result.areaFactor).toBeCloseTo(0.005)
    expect(result.precioCalculado).toBe(1250)
    expect(result.precioCobro).toBe(18000)
  })

  it('cobra el valor calculado cuando supera el mínimo', () => {
    const result = computeTerminadoPrecio('21', '14.8', 50, 10000, 18000)
    expect(result.precioCalculado).toBeGreaterThan(18000)
    expect(result.precioCobro).toBe(result.precioCalculado)
  })
})
