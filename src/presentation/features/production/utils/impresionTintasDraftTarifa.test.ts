import { describe, expect, it } from 'vitest'
import { TarifaMillar } from '../../../../core/domain/entities/TarifaMillar'
import {
  applyImpresionLadoCantidadChange,
  emptyImpresionLadoTintas,
  updateImpresionLadoTinta,
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
  it('no precarga tarifas si la plancha no está completa', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const next = syncImpresionTintasDraftTarifa(
      emptyImpresionTintasDraftTarifa(),
      tarifas,
      tiro,
      emptyImpresionLadoTintas(),
      4
    )
    expect(next.precioColorBasicoMillar).toBe(0)
    expect(next.precioPantoneMillar).toBe(0)
  })

  it('precarga PRECIO cuando la plancha está completa con Color básico', () => {
    const tiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2), 0, 0),
      1,
      1
    )
    const retiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2), 0, 2),
      1,
      3
    )
    const next = syncImpresionTintasDraftTarifa(
      emptyImpresionTintasDraftTarifa(),
      tarifas,
      tiro,
      retiro,
      4
    )
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
