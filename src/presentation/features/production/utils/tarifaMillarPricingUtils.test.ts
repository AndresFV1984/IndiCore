import { describe, expect, it } from 'vitest'
import {
  applyMillarDecimalRounding,
  applyMillarMinimoVenta,
  applyTopeMinimoMillar,
  computeMillaresCalculados,
  computeTarifaMillarCobro,
  computeValorImpresionColorBasicoPorReferencia,
  computeValorImpresionPorMillaresReferencia,
  getMillarParteDecimal,
  resolveMillaresParaCobro,
} from './tarifaMillarPricingUtils'

describe('getMillarParteDecimal', () => {
  it('extrae la parte decimal del millar', () => {
    expect(getMillarParteDecimal(2.15)).toBeCloseTo(0.15)
    expect(getMillarParteDecimal(3)).toBe(0)
  })
})

describe('applyMillarDecimalRounding', () => {
  it('conserva solo la parte entera cuando el decimal es ≤ 0,2', () => {
    expect(applyMillarDecimalRounding(0.15)).toBe(0)
    expect(applyMillarDecimalRounding(2.15)).toBe(2)
    expect(applyMillarDecimalRounding(7.19)).toBe(7)
  })

  it('sube al entero siguiente cuando el decimal es > 0,2', () => {
    expect(applyMillarDecimalRounding(1.25)).toBe(2)
    expect(applyMillarDecimalRounding(0.85)).toBe(1)
    expect(applyMillarDecimalRounding(2.25)).toBe(3)
    expect(applyMillarDecimalRounding(2.5)).toBe(3)
    expect(applyMillarDecimalRounding(7.5)).toBe(8)
  })

  it('conserva la parte entera cuando el decimal es igual al umbral', () => {
    expect(applyMillarDecimalRounding(2.2)).toBe(2)
    expect(applyMillarDecimalRounding(1.2)).toBe(1)
  })

  it('usa el umbral registrado en la tarifa', () => {
    expect(applyMillarDecimalRounding(2.35, 0.4)).toBe(2)
    expect(applyMillarDecimalRounding(2.45, 0.4)).toBe(3)
    expect(applyMillarDecimalRounding(2.55, 0.4)).toBe(3)
  })

  it('devuelve el entero sin cambios cuando no hay decimales', () => {
    expect(applyMillarDecimalRounding(10)).toBe(10)
  })
})

describe('computeMillaresCalculados', () => {
  it('calcula (tiro + retiro) × tamaños buenos / 1000 sin ajuste', () => {
    expect(computeMillaresCalculados(4, 2500)).toBe(10)
    expect(computeMillaresCalculados(1, 500)).toBe(0.5)
  })
})

describe('resolveMillaresParaCobro', () => {
  it('aplica tope mínimo o regla de decimales según los millares calculados', () => {
    expect(resolveMillaresParaCobro(0.5, 1000, 0.2, 600)).toBe(1)
    expect(resolveMillaresParaCobro(2.15, 1000, 0.2, 600)).toBe(2)
    expect(resolveMillaresParaCobro(0.5, 500, 0.2, 600)).toBe(0.5)
    expect(resolveMillaresParaCobro(0.3, 500, 0.2, 600)).toBe(0.5)
    expect(resolveMillaresParaCobro(5, 500, 0.2, 600)).toBe(5)
  })

  it('usa millar mínimo venta ÷ 1.000 cuando queda por debajo del tope', () => {
    expect(resolveMillaresParaCobro(0.15, 500, 0.2, 600)).toBe(0.5)
    expect(resolveMillaresParaCobro(0.4, 500, 0.2, 600)).toBe(0.5)
  })
})

describe('applyMillarMinimoVenta', () => {
  it('aplica el millar mínimo venta de la tarifa en unidades ÷ 1.000', () => {
    expect(applyMillarMinimoVenta(2, 500)).toBe(2)
    expect(applyMillarMinimoVenta(0.3, 500)).toBe(0.5)
    expect(applyMillarMinimoVenta(3, 2000)).toBe(3)
  })
})

describe('applyTopeMinimoMillar', () => {
  it('devuelve millar mínimo venta ÷ 1.000 cuando los millares calculados quedan bajo el tope', () => {
    expect(applyTopeMinimoMillar(0.4, 600, 500)).toBe(0.5)
    expect(applyTopeMinimoMillar(0.15, 600, 500)).toBe(0.5)
  })

  it('no aplica ajuste cuando los millares calculados superan el tope mínimo', () => {
    expect(applyTopeMinimoMillar(1, 600, 500)).toBeNull()
    expect(applyTopeMinimoMillar(5, 600, 500)).toBeNull()
  })
})

describe('computeTarifaMillarCobro', () => {
  it('cobra millares × precio por defecto cuando supera el mínimo', () => {
    expect(
      computeTarifaMillarCobro(2.5, {
        millarMinimoVenta: 1,
        precio: 17500,
        topeMinimoMillar: 1,
        umbralDecimalMillar: 0.2,
      })
    ).toEqual({ millares: 3, precio: 52_500 })
  })

  it('cobra millar mínimo venta ÷ 1.000 cuando queda bajo el tope mínimo', () => {
    expect(
      computeTarifaMillarCobro(0.15, {
        millarMinimoVenta: 500,
        precio: 17500,
        topeMinimoMillar: 600,
        umbralDecimalMillar: 0.2,
      })
    ).toEqual({ millares: 0.5, precio: 8750 })
  })

  it('cobra los millares ajustados cuando superan el tope mínimo', () => {
    expect(
      computeTarifaMillarCobro(5, {
        millarMinimoVenta: 500,
        precio: 17500,
        topeMinimoMillar: 600,
        umbralDecimalMillar: 0.2,
      })
    ).toEqual({ millares: 5, precio: 87_500 })
  })

  it('cobra millar mínimo venta ÷ 1.000 cuando los millares calculados quedan bajo el tope', () => {
    expect(
      computeTarifaMillarCobro(0.5, {
        millarMinimoVenta: 500,
        precio: 17500,
        topeMinimoMillar: 600,
        umbralDecimalMillar: 0.2,
      })
    ).toEqual({ millares: 0.5, precio: 8750 })
  })
})

describe('computeValorImpresionColorBasicoPorReferencia', () => {
  it('usa precio con volteo cuando tamaños buenos referencia es 500', () => {
    expect(
      computeValorImpresionColorBasicoPorReferencia({
        millaresReferencia: 2,
        tamanosBuenosReferencia: 500,
        precioConVolteo: 20_000,
        precioSinVolteo: 17_500,
      })
    ).toBe(40_000)
  })

  it('usa precio sin volteo cuando tamaños buenos referencia no es 500', () => {
    expect(
      computeValorImpresionColorBasicoPorReferencia({
        millaresReferencia: 2,
        tamanosBuenosReferencia: 2000,
        precioConVolteo: 20_000,
        precioSinVolteo: 17_500,
      })
    ).toBe(35_000)
  })
})

describe('computeValorImpresionPorMillaresReferencia', () => {
  it('sin volteo multiplica millares referencia por precio millar sin volteo', () => {
    expect(
      computeValorImpresionPorMillaresReferencia({
        millaresReferencia: 10,
        precioInicial: 17_500,
        precioPorMillar: 17_500,
        conVolteo: false,
        topeMinimoMillar: 600,
      })
    ).toBe(175_000)
  })

  it('con volteo y referencia bajo el tope usa precio con volteo', () => {
    expect(
      computeValorImpresionPorMillaresReferencia({
        millaresReferencia: 0.5,
        precioInicial: 17_500,
        precioPorMillar: 20_000,
        conVolteo: true,
        topeMinimoMillar: 600,
      })
    ).toBe(10_000)
  })

  it('con volteo y referencia ≥ tope usa precio millar sin volteo', () => {
    expect(
      computeValorImpresionPorMillaresReferencia({
        millaresReferencia: 10,
        precioInicial: 17_500,
        precioPorMillar: 20_000,
        conVolteo: true,
        topeMinimoMillar: 600,
      })
    ).toBe(175_000)
  })
})
