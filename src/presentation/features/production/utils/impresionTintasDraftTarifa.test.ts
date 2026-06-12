import { describe, expect, it } from 'vitest'
import { TarifaMillar } from '../../../../core/domain/entities/TarifaMillar'
import {
  applyImpresionLadoCantidadChange,
  emptyImpresionLadoTintas,
} from './impresionTintasUtils'
import {
  emptyImpresionTintasDraftTarifa,
  patchImpresionTintasDraftTarifaVolteo,
  syncImpresionTintasDraftTarifa,
} from './impresionTintasDraftTarifa'

const tarifaColorBasico = new TarifaMillar('tm-1', 'Color básico', 1000, 17500, 'Colores', '', true)
const tarifaPantone = new TarifaMillar('tm-4', 'Pantone', 1000, 50000, 'Colores', '', true)
const tarifas = [tarifaColorBasico, tarifaPantone]

describe('syncImpresionTintasDraftTarifa', () => {
  it('precarga PRECIO y deja volteo en sin volteo por defecto', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const next = syncImpresionTintasDraftTarifa(emptyImpresionTintasDraftTarifa(), tarifas, tiro, emptyImpresionLadoTintas())
    expect(next.tipoBifronteColorBasico).toBe('diferente-plancha')
    expect(next.precioColorBasicoMillar).toBe(17500)
    expect(next.precioVolteoColorBasicoMillar).toBe(0)
  })
})

describe('patchImpresionTintasDraftTarifaVolteo', () => {
  it('carga precio de volteo al seleccionar pinza', () => {
    const prev = emptyImpresionTintasDraftTarifa()
    const next = patchImpresionTintasDraftTarifaVolteo(prev, tarifas, 'colorBasico', 'volteo-pinza')
    expect(next.tipoBifronteColorBasico).toBe('volteo-pinza')
    expect(next.precioVolteoColorBasicoMillar).toBe(20_000)
    expect(next.tarifaVolteoColorBasicoMillarId).toBe('tm-1')
  })

  it('carga precio Pantone al seleccionar escuadra', () => {
    const prev = emptyImpresionTintasDraftTarifa()
    const next = patchImpresionTintasDraftTarifaVolteo(prev, tarifas, 'pantone', 'volteo-escuadra')
    expect(next.tipoBifrontePantone).toBe('volteo-escuadra')
    expect(next.precioVolteoPantoneMillar).toBe(70_000)
    expect(next.tarifaVolteoPantoneMillarId).toBe('tm-4')
  })
})
