import { describe, expect, it } from 'vitest'
import { TarifaMillar } from '../../../../core/domain/entities/TarifaMillar'
import {
  formatPrecioMillar,
  formatUnidadMillar,
  getImpresionVolteoMillarRules,
  getImpresionVolteoMillarRulesFromTarifa,
  resolveColorBasicoVolteoMillarPatch,
  resolvePantoneVolteoMillarPatch,
  resolvePrecioVolteoMillarPatch,
} from './impresionVolteoTarifaUtils'
import {
  IMPRESION_VOLTEO_PRECIO_COLOR_BASICO_MILLAR,
  IMPRESION_VOLTEO_PRECIO_PANTONE_MILLAR,
} from '../constants/impresionTarifaMillar'

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

const tarifas = [tarifaColorBasico, tarifaPantone]

describe('resolvePrecioVolteoMillarPatch', () => {
  it('limpia precio cuando no hay volteo', () => {
    expect(resolvePrecioVolteoMillarPatch(tarifas, 'diferente-plancha')).toEqual({
      tarifaVolteoMillarId: '',
      precioVolteoMillar: 0,
    })
  })

  it('asigna precio de volteo desde tarifa Color básico', () => {
    expect(resolvePrecioVolteoMillarPatch(tarifas, 'volteo-pinza')).toEqual({
      tarifaVolteoMillarId: 'tm-1',
      precioVolteoMillar: IMPRESION_VOLTEO_PRECIO_COLOR_BASICO_MILLAR,
    })
    expect(resolvePrecioVolteoMillarPatch(tarifas, 'volteo-escuadra')).toEqual({
      tarifaVolteoMillarId: 'tm-1',
      precioVolteoMillar: IMPRESION_VOLTEO_PRECIO_COLOR_BASICO_MILLAR,
    })
  })
})

describe('resolveColorBasicoVolteoMillarPatch', () => {
  it('limpia precio cuando no hay volteo', () => {
    expect(resolveColorBasicoVolteoMillarPatch(tarifas, 'diferente-plancha')).toEqual({
      tarifaVolteoColorBasicoMillarId: '',
      precioVolteoColorBasicoMillar: 0,
    })
  })

  it('asigna precio de volteo vinculado a tarifa Color básico', () => {
    expect(resolveColorBasicoVolteoMillarPatch(tarifas, 'volteo-pinza')).toEqual({
      tarifaVolteoColorBasicoMillarId: 'tm-1',
      precioVolteoColorBasicoMillar: 20_000,
    })
  })

  it('usa precios de pinza y escuadra definidos en Tarifas por millar', () => {
    const tarifaCatalogo = new TarifaMillar(
      'tm-1',
      'Color básico',
      1000,
      17500,
      'Colores',
      '',
      true,
      500,
      600,
      0.2,
      21_000,
      23_000
    )

    expect(resolveColorBasicoVolteoMillarPatch([tarifaCatalogo], 'volteo-pinza')).toEqual({
      tarifaVolteoColorBasicoMillarId: 'tm-1',
      precioVolteoColorBasicoMillar: 21_000,
    })
    expect(resolveColorBasicoVolteoMillarPatch([tarifaCatalogo], 'volteo-escuadra')).toEqual({
      tarifaVolteoColorBasicoMillarId: 'tm-1',
      precioVolteoColorBasicoMillar: 23_000,
    })
  })
})

describe('resolvePantoneVolteoMillarPatch', () => {
  it('asigna precio de volteo vinculado a tarifa Pantone', () => {
    expect(resolvePantoneVolteoMillarPatch(tarifas, 'volteo-escuadra')).toEqual({
      tarifaVolteoPantoneMillarId: 'tm-4',
      precioVolteoPantoneMillar: 70_000,
    })
  })
})

describe('getImpresionVolteoMillarRulesFromTarifa', () => {
  it('reutiliza reglas de millar de la tarifa asociada', () => {
    expect(getImpresionVolteoMillarRulesFromTarifa(tarifaColorBasico)).toEqual({
      precio: 0,
      millarMinimoVenta: 500,
      topeMinimoMillar: 600,
      umbralDecimalMillar: 0.2,
    })
  })
})

describe('getImpresionVolteoMillarRules', () => {
  it('expone reglas de millar para volteo', () => {
    expect(getImpresionVolteoMillarRules()).toEqual({
      precio: 0,
      millarMinimoVenta: 500,
      topeMinimoMillar: 600,
      umbralDecimalMillar: 0.2,
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
