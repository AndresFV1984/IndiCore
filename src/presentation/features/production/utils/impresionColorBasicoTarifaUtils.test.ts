import { describe, expect, it } from 'vitest'
import { TarifaMillar } from '../../../../core/domain/entities/TarifaMillar'
import {
  applyImpresionLadoCantidadChange,
  emptyImpresionLadoTintas,
  updateImpresionLadoTinta,
} from './impresionTintasUtils'
import {
  entradaUsesPantoneInks,
  entradaUsesPrimaryOrSecondaryInks,
  resolveColorBasicoMillarPatchForEntrada,
  resolvePantoneMillarPatchForEntrada,
  resolvePrecioColorBasicoMillarPatch,
  resolvePrecioPantoneMillarPatch,
  resolveTarifaColorBasicoMillar,
  resolveTarifaPantoneMillar,
  resolveTintasMillarPatchForEntrada,
  shouldApplyColorBasicoTarifa,
  shouldApplyPantoneTarifa,
} from './impresionColorBasicoTarifaUtils'

const tarifaColorBasico = new TarifaMillar(
  'tm-1',
  'Color básico',
  1000,
  17500,
  'Colores',
  '',
  true
)

const tarifaPantone = new TarifaMillar(
  'tm-4',
  'Pantone',
  1000,
  50000,
  'Colores',
  '',
  true
)

describe('resolveTarifaColorBasicoMillar', () => {
  it('resuelve la tarifa Color básico activa', () => {
    expect(resolveTarifaColorBasicoMillar([tarifaPantone, tarifaColorBasico])?.id).toBe('tm-1')
  })

  it('ignora tarifas inactivas', () => {
    const inactiva = new TarifaMillar('tm-x', 'Color básico', 1000, 1, 'Colores', '', false)
    expect(resolveTarifaColorBasicoMillar([inactiva])).toBeNull()
  })
})

describe('entradaUsesPrimaryOrSecondaryInks', () => {
  it('detecta primarios y secundarios', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    expect(entradaUsesPrimaryOrSecondaryInks(tiro, emptyImpresionLadoTintas())).toBe(true)
  })

  it('no aplica cuando solo hay Pantone', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      7
    )
    const retiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      7
    )
    expect(entradaUsesPrimaryOrSecondaryInks(tiro, retiro)).toBe(false)
  })
})

describe('shouldApplyColorBasicoTarifa', () => {
  it('exige plancha completa y al menos un color primario o secundario', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    expect(shouldApplyColorBasicoTarifa(tiro, retiro, 4)).toBe(true)
  })

  it('no aplica si faltan colores por asignar', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    expect(shouldApplyColorBasicoTarifa(tiro, emptyImpresionLadoTintas(), 4)).toBe(false)
  })

  it('no aplica si todos los colores son Pantone', () => {
    const tiroBase = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiroBase = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const tiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(tiroBase, 0, 7),
      1,
      7
    )
    const retiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(retiroBase, 0, 7),
      1,
      7
    )
    expect(shouldApplyColorBasicoTarifa(tiro, retiro, 4)).toBe(false)
  })
})

describe('resolveColorBasicoMillarPatchForEntrada', () => {
  it('limpia el patch cuando no aplica', () => {
    expect(
      resolveColorBasicoMillarPatchForEntrada(
        [tarifaColorBasico],
        emptyImpresionLadoTintas(),
        emptyImpresionLadoTintas(),
        4
      )
    ).toEqual({
      tarifaColorBasicoMillarId: '',
      precioColorBasicoMillar: 0,
    })
  })

  it('asigna tarifa cuando la entrada califica', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    expect(resolveColorBasicoMillarPatchForEntrada([tarifaColorBasico], tiro, retiro, 4)).toEqual({
      tarifaColorBasicoMillarId: 'tm-1',
      precioColorBasicoMillar: 17500,
    })
  })
})

describe('resolvePrecioColorBasicoMillarPatch', () => {
  it('devuelve precio de la tarifa activa', () => {
    expect(resolvePrecioColorBasicoMillarPatch([tarifaColorBasico])).toEqual({
      tarifaColorBasicoMillarId: 'tm-1',
      precioColorBasicoMillar: 17500,
    })
  })
})

describe('resolveTarifaPantoneMillar', () => {
  it('resuelve la tarifa Pantone activa', () => {
    expect(resolveTarifaPantoneMillar([tarifaColorBasico, tarifaPantone])?.id).toBe('tm-4')
  })
})

describe('entradaUsesPantoneInks', () => {
  it('detecta al menos un Pantone', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      1,
      7
    )
    expect(entradaUsesPantoneInks(tiro, emptyImpresionLadoTintas())).toBe(true)
  })
})

describe('shouldApplyPantoneTarifa', () => {
  it('exige plancha completa y al menos un Pantone', () => {
    const tiroBase = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiroBase = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const tiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(tiroBase, 0, 7),
      1,
      7
    )
    const retiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(retiroBase, 0, 7),
      1,
      7
    )
    expect(shouldApplyPantoneTarifa(tiro, retiro, 4)).toBe(true)
  })

  it('no aplica si faltan colores por asignar', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      7
    )
    expect(shouldApplyPantoneTarifa(tiro, emptyImpresionLadoTintas(), 4)).toBe(false)
  })
})

describe('resolvePantoneMillarPatchForEntrada', () => {
  it('asigna tarifa cuando hay Pantone y la plancha está completa', () => {
    const tiroBase = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiroBase = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const tiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(tiroBase, 0, 7),
      1,
      7
    )
    const retiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(retiroBase, 0, 7),
      1,
      7
    )
    expect(resolvePantoneMillarPatchForEntrada([tarifaPantone], tiro, retiro, 4)).toEqual({
      tarifaPantoneMillarId: 'tm-4',
      precioPantoneMillar: 50000,
    })
  })
})

describe('resolvePrecioPantoneMillarPatch', () => {
  it('devuelve precio de la tarifa activa', () => {
    expect(resolvePrecioPantoneMillarPatch([tarifaPantone])).toEqual({
      tarifaPantoneMillarId: 'tm-4',
      precioPantoneMillar: 50000,
    })
  })
})

describe('resolveTintasMillarPatchForEntrada', () => {
  it('combina Color básico y Pantone cuando ambos aplican', () => {
    const tiroBase = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiroBase = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const tiro = updateImpresionLadoTinta(tiroBase, 1, 7)
    const retiro = retiroBase
    expect(
      resolveTintasMillarPatchForEntrada([tarifaColorBasico, tarifaPantone], tiro, retiro, 4)
    ).toEqual({
      tarifaColorBasicoMillarId: 'tm-1',
      precioColorBasicoMillar: 17500,
      tarifaPantoneMillarId: 'tm-4',
      precioPantoneMillar: 50000,
    })
  })
})
