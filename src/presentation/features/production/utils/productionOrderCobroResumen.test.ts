import { describe, expect, it } from 'vitest'
import { emptyPreprensaDiseno } from '../../../../core/domain/entities/PreprensaDiseno'
import { buildProductionOrderCobroResumen } from './productionOrderCobroResumen'

describe('buildProductionOrderCobroResumen', () => {
  it('suma los subtotales de cada etapa en el total a cobrar', () => {
    const diseno = {
      ...emptyPreprensaDiseno(),
      aplicaCostoDiseno: true,
      crearDisenoCost: 50000,
      valorTotalPlanchas: 120000,
      precioMontajeId: 'montaje-1',
      precioMontajeCosto: 30000,
    }

    const resumen = buildProductionOrderCobroResumen({
      preprensaDiseno: diseno,
      coloresPlanchas: [],
      paperRows: [],
      tiposPapel: [],
      margenRedondeo: 0,
      clienteSuministraPapel: 'no',
      impresionTintasRegistros: [],
      terminadosRegistros: [],
      acabadosRegistros: [],
    })

    expect(resumen.sections.find(section => section.id === 'preprensa')?.subtotal).toBe(200000)
    expect(resumen.grandTotal).toBe(200000)
    expect(resumen.hasCharges).toBe(true)
  })
})
