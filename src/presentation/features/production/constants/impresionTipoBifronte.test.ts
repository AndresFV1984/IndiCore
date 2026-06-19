import { describe, expect, it } from 'vitest'
import {
  applyImpresionLadoCantidadChange,
  emptyImpresionLadoTintas,
  updateImpresionLadoTinta,
} from '../utils/impresionTintasUtils'
import {
  canUseImpresionVolteo,
  canUseImpresionVolteoForGrupo,
  resolveImpresionVolteoBloqueadoHint,
  sanitizeImpresionTipoBifronteForCavidades,
  sanitizeImpresionTipoBifronteForVolteo,
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

describe('canUseImpresionVolteoForGrupo', () => {
  const tiroColorBasico = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)
  const retiroColorBasico = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)
  const tiroPantone = updateImpresionLadoTinta(
    applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
    0,
    7
  )
  const retiroPantone = updateImpresionLadoTinta(
    applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
    0,
    7
  )

  it('exige color básico en tiro y retiro', () => {
    expect(
      canUseImpresionVolteoForGrupo('colorBasico', 2, tiroColorBasico, emptyImpresionLadoTintas())
    ).toBe(false)
    expect(
      canUseImpresionVolteoForGrupo('colorBasico', 2, tiroColorBasico, retiroColorBasico)
    ).toBe(true)
  })

  it('exige Pantone en tiro y retiro', () => {
    expect(
      canUseImpresionVolteoForGrupo('pantone', 2, tiroPantone, emptyImpresionLadoTintas())
    ).toBe(false)
    expect(canUseImpresionVolteoForGrupo('pantone', 2, tiroPantone, retiroPantone)).toBe(true)
  })

  it('sigue exigiendo cavidades pares', () => {
    expect(
      canUseImpresionVolteoForGrupo('colorBasico', 3, tiroColorBasico, retiroColorBasico)
    ).toBe(false)
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

describe('sanitizeImpresionTipoBifronteForVolteo', () => {
  const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)
  const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)

  it('fuerza sin volteo si falta el grupo en tiro o retiro', () => {
    expect(
      sanitizeImpresionTipoBifronteForVolteo('volteo-pinza', 'colorBasico', 2, tiro, emptyImpresionLadoTintas())
    ).toBe('diferente-plancha')
  })

  it('conserva volteo con cavidades pares y grupo en ambos lados', () => {
    expect(
      sanitizeImpresionTipoBifronteForVolteo('volteo-pinza', 'colorBasico', 2, tiro, retiro)
    ).toBe('volteo-pinza')
  })
})

describe('resolveImpresionVolteoBloqueadoHint', () => {
  const copy = {
    cavidadesPares: 'cavidades pares',
    tiroRetiroColorBasico: 'tiro y retiro color básico',
    tiroRetiroPantone: 'tiro y retiro pantone',
  }
  const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)

  it('prioriza mensaje de cavidades', () => {
    expect(
      resolveImpresionVolteoBloqueadoHint('colorBasico', 1, tiro, emptyImpresionLadoTintas(), copy)
    ).toBe('cavidades pares')
  })

  it('informa cuando falta tiro y retiro del grupo', () => {
    expect(
      resolveImpresionVolteoBloqueadoHint('colorBasico', 2, tiro, emptyImpresionLadoTintas(), copy)
    ).toBe('tiro y retiro color básico')
  })
})
