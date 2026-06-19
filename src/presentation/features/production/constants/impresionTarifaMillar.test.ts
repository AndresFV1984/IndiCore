import { describe, expect, it } from 'vitest'
import {
  IMPRESION_VOLTEO_PRECIO_PANTONE_MILLAR,
  resolveTarifaMillarPrecioConVolteoDefault,
} from './impresionTarifaMillar'

describe('resolveTarifaMillarPrecioConVolteoDefault', () => {
  it('devuelve 0 cuando la tarifa es null', () => {
    expect(resolveTarifaMillarPrecioConVolteoDefault(null)).toBe(0)
  })

  it('resuelve el precio con volteo por defecto desde el catálogo', () => {
    expect(
      resolveTarifaMillarPrecioConVolteoDefault({
        name: 'Pantone',
        precioVolteoPinza: 0,
        precioVolteoEscuadra: 0,
      })
    ).toBe(IMPRESION_VOLTEO_PRECIO_PANTONE_MILLAR)
  })
})
