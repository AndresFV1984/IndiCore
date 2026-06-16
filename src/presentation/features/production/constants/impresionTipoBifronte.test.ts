import { describe, expect, it } from 'vitest'
import {
  canUseImpresionVolteo,
  sanitizeImpresionTipoBifronteForCavidades,
} from './impresionTipoBifronte'

describe('canUseImpresionVolteo', () => {
  it('permite volteo solo con cavidades pares mayores a cero', () => {
    expect(canUseImpresionVolteo(0)).toBe(false)
    expect(canUseImpresionVolteo(1)).toBe(false)
    expect(canUseImpresionVolteo(2)).toBe(true)
    expect(canUseImpresionVolteo(3)).toBe(false)
    expect(canUseImpresionVolteo(4)).toBe(true)
  })
})

describe('sanitizeImpresionTipoBifronteForCavidades', () => {
  it('conserva volteo con cavidades pares', () => {
    expect(sanitizeImpresionTipoBifronteForCavidades('volteo-pinza', 2)).toBe('volteo-pinza')
    expect(sanitizeImpresionTipoBifronteForCavidades('volteo-escuadra', 4)).toBe('volteo-escuadra')
  })

  it('fuerza sin volteo cuando las cavidades no son pares', () => {
    expect(sanitizeImpresionTipoBifronteForCavidades('volteo-pinza', 1)).toBe('diferente-plancha')
    expect(sanitizeImpresionTipoBifronteForCavidades('volteo-escuadra', 3)).toBe('diferente-plancha')
    expect(sanitizeImpresionTipoBifronteForCavidades('diferente-plancha', 1)).toBe('diferente-plancha')
  })
})
