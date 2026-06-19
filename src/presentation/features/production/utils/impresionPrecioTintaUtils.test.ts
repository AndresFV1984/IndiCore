import { describe, expect, it } from 'vitest'
import {
  applyImpresionLadoCantidadChange,
  emptyImpresionLadoTintas,
  updateImpresionLadoTinta,
} from './impresionTintasUtils'
import {
  computeImpresionMillaresFactor,
  computeImpresionPrecioTinta,
  buildImpresionTintasResumenConsolidado,
  computeImpresionPrecioTintaBreakdown,
  buildValorImpresionFormulaSteps,
  resolveValorImpresionPrecioUnitario,
  resolveEntradaRegistroResumen,
  sumDistinctNonPantoneColorsBySide,
  sumDistinctPantoneColorsBySide,
  sumPantoneTintasBySide,
} from './impresionPrecioTintaUtils'
import { createImpresionTiroRetiroEntrada } from './impresionTintasUtils'

describe('sumDistinctPantoneColorsBySide', () => {
  it('suma Pantone distintos por tiro + retiro', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      0,
      7
    )
    const retiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      0,
      7
    )

    // 1 pantone en tiro + 1 pantone en retiro
    expect(sumDistinctPantoneColorsBySide(tiro, retiro)).toBe(2)
  })

  it('devuelve 0 sin Pantone', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    expect(sumDistinctPantoneColorsBySide(tiro, retiro)).toBe(0)
  })
})

describe('sumPantoneTintasBySide', () => {
  it('suma cada ranura Pantone en tiro + retiro aunque repita el mismo índice', () => {
    const tiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        0,
        7
      ),
      1,
      7
    )
    const retiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      7
    )

    expect(sumPantoneTintasBySide(tiro, retiro)).toBe(3)
  })
})

describe('sumDistinctNonPantoneColorsBySide', () => {
  it('suma colores distintos NO-Pantone por tiro + retiro', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2) // defaults: [0,1]
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1) // default: [0]

    // NO-Pantone distintos: tiro {0,1} (2) + retiro {0} (1) => 3
    expect(sumDistinctNonPantoneColorsBySide(tiro, retiro)).toBe(3)
  })

  it('devuelve 0 si todo es Pantone', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      7
    )
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)
    expect(sumDistinctNonPantoneColorsBySide(tiro, retiro)).toBe(0)
  })
})

describe('computeImpresionMillaresFactor', () => {
  it('calcula (tiro + retiro) × tamaños buenos / 1000', () => {
    expect(computeImpresionMillaresFactor(4, 2500)).toBe(10)
  })

  it('aplica mínimo 1 cuando el factor es menor a 1', () => {
    expect(computeImpresionMillaresFactor(1, 500)).toBe(1)
  })
})

describe('computeImpresionPrecioTintaBreakdown', () => {
  it('con varias ranuras Pantone en un lado multiplica millares por cada una', () => {
    const tiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        0,
        7
      ),
      1,
      7
    )
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 2500, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
    })

    expect(breakdown.cantidadTintasPantone).toBe(2)
    expect(breakdown.millaresPantone).toBe(5)
    expect(breakdown.pantone).toBe(250_000)
  })

  it('devuelve desglose separado por Color básico y Pantone', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      0,
      7
    )
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 2500, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
    })

    expect(breakdown.cantidadTintasColorBasico).toBe(3)
    expect(breakdown.cantidadTintasPantone).toBe(1)
    expect(breakdown.millaresColorBasico).toBe(8)
    expect(breakdown.millaresPantone).toBe(3)
    expect(breakdown.millaresTotal).toBe(11)
    expect(breakdown.colorBasico).toBe(140_000)
    expect(breakdown.pantone).toBe(150_000)
    expect(breakdown.total).toBe(290_000)
    expect(breakdown.millaresVolteo).toBe(0)
    expect(breakdown.volteo).toBe(0)
    expect(breakdown.grandTotal).toBe(290_000)
  })

  it('con tamaños buenos referencia 500 usa precio con volteo en Color básico', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 250, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
      precioVolteoColorBasicoMillar: 20_000,
      conVolteoColorBasico: true,
      topeMinimoMillarVolteoColorBasico: 600,
      millarMinimoVentaVolteoColorBasico: 500,
    }, { tamanosBuenosReferencia: 500 })

    expect(breakdown.millaresColorBasico).toBe(0.5)
    expect(breakdown.colorBasico).toBe(10_000)
    expect(breakdown.millaresVolteo).toBe(0)
    expect(breakdown.volteo).toBe(0)
    expect(breakdown.grandTotal).toBe(10_000)
  })

  it('con volteo Color básico y tamaños buenos colores básicos ≤ 500 usa precio con volteo aunque supere tope', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 500, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
      precioVolteoColorBasicoMillar: 20_000,
      conVolteoColorBasico: true,
      topeMinimoMillarVolteoColorBasico: 600,
      millarMinimoVentaVolteoColorBasico: 500,
    }, { tamanosBuenosReferenciaColorBasico: 500 })

    expect(breakdown.millaresColorBasico).toBe(2)
    expect(breakdown.colorBasico).toBe(40_000)
    expect(breakdown.millaresVolteo).toBe(0)
    expect(breakdown.volteo).toBe(0)
    expect(breakdown.grandTotal).toBe(40_000)
  })

  it('con referencia distinta de 500 usa precio millar sin volteo en Color básico', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 2500, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
      precioVolteoColorBasicoMillar: 20_000,
      conVolteoColorBasico: true,
      topeMinimoMillarVolteoColorBasico: 600,
    }, { tamanosBuenosReferencia: 2500 })

    expect(breakdown.millaresColorBasico).toBe(10)
    expect(breakdown.colorBasico).toBe(175_000)
    expect(breakdown.millaresVolteo).toBe(0)
    expect(breakdown.volteo).toBe(0)
    expect(breakdown.grandTotal).toBe(175_000)
  })

  it('con tamaños buenos pantone ≤ 500 usa precio con volteo en Pantone sin volteo', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      7
    )
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 500, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
      precioVolteoPantoneMillar: 70_000,
      conVolteoPantone: false,
      topeMinimoMillarPantone: 600,
      millarMinimoVentaPantone: 500,
    }, { tamanosBuenosReferenciaPantone: 500 })

    expect(breakdown.millaresPantone).toBe(0.5)
    expect(breakdown.pantone).toBe(35_000)
    expect(breakdown.grandTotal).toBe(35_000)
  })

  it('con volteo Pantone y tamaños buenos pantone ≤ 500 usa precio con volteo aunque supere tope', () => {
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

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 500, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
      precioVolteoPantoneMillar: 70_000,
      conVolteoPantone: true,
      topeMinimoMillarVolteoPantone: 600,
      millarMinimoVentaVolteoPantone: 500,
    }, {
      tamanosBuenosPantone: 500,
      tamanosBuenosReferenciaPantone: 500,
    })

    expect(breakdown.millaresPantone).toBe(1)
    expect(breakdown.pantone).toBe(70_000)
    expect(breakdown.grandTotal).toBe(70_000)
  })

  it('con tamaños buenos pantone > 500 usa precio millar sin volteo en Pantone sin volteo', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      7
    )
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 1000, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
      precioVolteoPantoneMillar: 70_000,
      conVolteoPantone: false,
      topeMinimoMillarPantone: 600,
      millarMinimoVentaPantone: 500,
    }, { tamanosBuenosReferenciaPantone: 1000 })

    expect(breakdown.millaresPantone).toBe(1)
    expect(breakdown.pantone).toBe(50_000)
    expect(breakdown.grandTotal).toBe(50_000)
  })

  it('con tamaños buenos pantone > 500 usa precio sin volteo aunque el millar sea 2', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      7
    )
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)

    const breakdown = computeImpresionPrecioTintaBreakdown(tiro, retiro, 2000, {
      precioColorBasicoMillar: 17_500,
      precioPantoneMillar: 50_000,
      precioVolteoPantoneMillar: 70_000,
      conVolteoPantone: false,
      topeMinimoMillarPantone: 600,
    }, { tamanosBuenosReferenciaPantone: 2000 })

    expect(breakdown.millaresPantone).toBe(2)
    expect(breakdown.pantone).toBe(100_000)
    expect(breakdown.grandTotal).toBe(100_000)
  })
})

describe('buildValorImpresionFormulaSteps', () => {
  const copy = {
    millaresReferencia: 'Millares calculados',
    precioImpresion: 'Precio impresión',
    operacion: 'Operación',
    tarifaConVolteo: 'Precio con volteo',
    tarifaSinVolteo: 'Precio sin volteo',
    motivoRef500: 'ref. 500',
    motivoRef1000: 'ref. 1.000',
    motivoVolteoBajoTope: 'bajo tope mínimo',
    motivoVolteoSobreTope: 'sobre tope mínimo',
  }

  const priceLabels = {
    precioConVolteo: 'Precio con volteo',
    precioSinVolteo: 'Precio millar sin volteo',
  }

  const formatPrecioEsCo = (value: number) => `$ ${value.toLocaleString('es-CO')}`

  it('resume Color básico sin volteo con referencia 500 sin motivo en etiqueta', () => {
    expect(
      buildValorImpresionFormulaSteps({
        variant: 'colorBasico',
        conVolteo: false,
        usaPrecioConVolteoColorBasico: true,
        usaPrecioConVolteoPantone: false,
        usaPrecioInicial: false,
        millaresCalculados: 1,
        precioUnitario: 70_000,
        valorImpresion: 70_000,
        copy,
        priceLabels,
        formatPrecio: formatPrecioEsCo,
      })
    ).toEqual([
      {
        stepRule: '',
        stepCalc:
          'Millares calculados: (1) × Precio con volteo ($ 70.000 ) = $ 70.000',
      },
    ])
  })

  it('resume Color básico con volteo bajo tope sin motivo en etiqueta', () => {
    expect(
      buildValorImpresionFormulaSteps({
        variant: 'colorBasico',
        conVolteo: true,
        usaPrecioConVolteoColorBasico: true,
        usaPrecioConVolteoPantone: false,
        usaPrecioInicial: false,
        millaresCalculados: 1,
        precioUnitario: 70_000,
        valorImpresion: 70_000,
        copy,
        priceLabels,
        formatPrecio: formatPrecioEsCo,
      })
    ).toEqual([
      {
        stepRule: '',
        stepCalc:
          'Millares calculados: (1) × Precio con volteo ($ 70.000 ) = $ 70.000',
      },
    ])
  })

  it('resume Color básico sin volteo ni referencia 500 con precio millar sin volteo', () => {
    expect(
      buildValorImpresionFormulaSteps({
        variant: 'colorBasico',
        conVolteo: false,
        usaPrecioConVolteoColorBasico: false,
        usaPrecioConVolteoPantone: false,
        usaPrecioInicial: true,
        millaresCalculados: 2,
        precioUnitario: 17_500,
        valorImpresion: 35_000,
        copy,
        priceLabels,
        formatPrecio: formatPrecioEsCo,
      })
    ).toEqual([
      {
        stepRule: '',
        stepCalc:
          'Millares calculados: (2) × Precio millar sin volteo ($ 17.500 ) = $ 35.000',
      },
    ])
  })

  it('resume Pantone sin volteo con tamaños buenos pantone ≤ 500 sin motivo en etiqueta', () => {
    expect(
      buildValorImpresionFormulaSteps({
        variant: 'pantone',
        conVolteo: false,
        usaPrecioConVolteoColorBasico: false,
        usaPrecioConVolteoPantone: true,
        usaPrecioInicial: false,
        millaresCalculados: 1,
        precioUnitario: 70_000,
        valorImpresion: 70_000,
        copy,
        priceLabels,
        formatPrecio: formatPrecioEsCo,
      })
    ).toEqual([
      {
        stepRule: '',
        stepCalc:
          'Millares calculados: (1) × Precio con volteo ($ 70.000 ) = $ 70.000',
      },
    ])
  })

  it('resume Pantone con volteo bajo tope sin motivo en etiqueta', () => {
    expect(
      buildValorImpresionFormulaSteps({
        variant: 'pantone',
        conVolteo: true,
        usaPrecioConVolteoColorBasico: false,
        usaPrecioConVolteoPantone: false,
        usaPrecioInicial: false,
        millaresCalculados: 1,
        precioUnitario: 70_000,
        valorImpresion: 70_000,
        copy,
        priceLabels,
        formatPrecio: formatPrecioEsCo,
      })
    ).toEqual([
      {
        stepRule: '',
        stepCalc:
          'Millares calculados: (1) × Precio con volteo ($ 70.000 ) = $ 70.000',
      },
    ])
  })

  it('resume Pantone sin volteo con tamaños buenos pantone > 500 con precio millar sin volteo', () => {
    expect(
      buildValorImpresionFormulaSteps({
        variant: 'pantone',
        conVolteo: false,
        usaPrecioConVolteoColorBasico: false,
        usaPrecioConVolteoPantone: false,
        usaPrecioInicial: true,
        millaresCalculados: 2,
        precioUnitario: 50_000,
        valorImpresion: 100_000,
        copy,
        priceLabels,
        formatPrecio: formatPrecioEsCo,
      })
    ).toEqual([
      {
        stepRule: '',
        stepCalc:
          'Millares calculados: (2) × Precio millar sin volteo ($ 50.000 ) = $ 100.000',
      },
    ])
  })
})

describe('resolveValorImpresionPrecioUnitario', () => {
  it('usa precio con volteo en Color básico con volteo bajo tope', () => {
    expect(
      resolveValorImpresionPrecioUnitario({
        variant: 'colorBasico',
        conVolteo: true,
        usaPrecioConVolteoColorBasico: true,
        usaPrecioConVolteoPantone: false,
        millaresCalculados: 2,
        topeMinimoMillarActivo: 5000,
        precioInicial: 17_500,
        precioPorMillar: 0,
        precioConVolteoMillar: 20_000,
      })
    ).toEqual({ precioUnitario: 20_000, usaPrecioInicial: false })
  })

  it('resume Pantone con volteo y tamaños buenos pantone ≤ 500 con precio con volteo aunque supere tope', () => {
    expect(
      resolveValorImpresionPrecioUnitario({
        variant: 'pantone',
        conVolteo: true,
        usaPrecioConVolteoColorBasico: false,
        usaPrecioConVolteoPantone: true,
        millaresCalculados: 2,
        topeMinimoMillarActivo: 600,
        precioInicial: 50_000,
        precioPorMillar: 70_000,
        precioConVolteoMillar: 70_000,
      })
    ).toEqual({ precioUnitario: 70_000, usaPrecioInicial: false })
  })

  it('fuerza precio con volteo en Color básico con volteo cuando tamaños buenos ≤ 500 aunque supere tope', () => {
    expect(
      resolveValorImpresionPrecioUnitario({
        variant: 'colorBasico',
        conVolteo: true,
        usaPrecioConVolteoColorBasico: true,
        usaPrecioConVolteoPantone: false,
        millaresCalculados: 6,
        topeMinimoMillarActivo: 5000,
        precioInicial: 17_500,
        precioPorMillar: 0,
        precioConVolteoMillar: 20_000,
      })
    ).toEqual({ precioUnitario: 20_000, usaPrecioInicial: false })
  })

  it('usa precio inicial en Color básico con volteo sobre tope cuando tamaños buenos > 500', () => {
    expect(
      resolveValorImpresionPrecioUnitario({
        variant: 'colorBasico',
        conVolteo: true,
        usaPrecioConVolteoColorBasico: false,
        usaPrecioConVolteoPantone: false,
        millaresCalculados: 6,
        topeMinimoMillarActivo: 5000,
        precioInicial: 17_500,
        precioPorMillar: 0,
        precioConVolteoMillar: 20_000,
      })
    ).toEqual({ precioUnitario: 17_500, usaPrecioInicial: true })
  })
})

describe('buildImpresionTintasResumenConsolidado', () => {
  it('consolida totales por plancha y el total a cobrar', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const entrada = {
      ...createImpresionTiroRetiroEntrada(tiro, retiro),
      precioTintaColorBasico: 100_000,
      precioTintaPantone: 50_000,
      precioTinta: 150_000,
      precioVolteo: 200_000,
    }

    const resumen = buildImpresionTintasResumenConsolidado(
      [
        {
          id: 'p1',
          colores: '4-colores',
          cantidad: 1000,
          numeroCavidades: 2,
          numeroPlanchas: 4,
          valorTotal: 0,
          sobrante: 0,
          detalle: 'Plancha A',
          observacion: '',
          planchaId: 'tp1',
          planchaNombreMedida: 'Medio pliego',
          planchaValor: 0,
        },
        {
          id: 'p2',
          colores: '2-colores',
          cantidad: 1000,
          numeroCavidades: 2,
          numeroPlanchas: 2,
          valorTotal: 0,
          sobrante: 0,
          detalle: 'Plancha B',
          observacion: '',
          planchaId: 'tp2',
          planchaNombreMedida: 'Cuarto pliego',
          planchaValor: 0,
        },
      ],
      [
        {
          colorPlanchaId: 'p1',
          entradas: [entrada],
          tipoBifronte: 'volteo-pinza',
        },
      ]
    )

    expect(resumen.registros).toHaveLength(2)
    expect(resumen.registros[0]?.totalCobrar).toBe(350_000)
    expect(resumen.registros[1]?.completo).toBe(false)
    expect(resumen.totales).toEqual({
      precioTintaColorBasico: 100_000,
      precioTintaPantone: 50_000,
      precioVolteo: 200_000,
      totalCobrar: 350_000,
      volteoColorBasico: 'con',
      volteoPantone: 'con',
    })
  })
})

describe('resolveEntradaRegistroResumen', () => {
  it('devuelve cantidades y precios guardados en la entrada', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const entrada = {
      ...createImpresionTiroRetiroEntrada(tiro, retiro),
      cantidadTintasColorBasico: 3,
      cantidadTintasPantone: 1,
      millaresColorBasico: 7.5,
      millaresPantone: 2.5,
      precioTintaColorBasico: 131_250,
      precioTintaPantone: 125_000,
      precioTinta: 256_250,
      millaresVolteo: 10,
      precioVolteo: 200_000,
    }

    expect(resolveEntradaRegistroResumen(entrada)).toEqual({
      cantidadTintasColorBasico: 3,
      cantidadTintasPantone: 1,
      millaresColorBasico: 7.5,
      millaresPantone: 2.5,
      precioTintaColorBasico: 131_250,
      precioTintaPantone: 125_000,
      precioTintaTotal: 256_250,
      millaresVolteo: 10,
      precioVolteo: 200_000,
      grandTotal: 456_250,
    })
  })
})

describe('computeImpresionPrecioTinta', () => {
  it('calcula Pantone por cada ranura seleccionada × tamaños buenos/1000 × Precio Pantone', () => {
    const tiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        0,
        7
      ),
      1,
      7
    )
    const retiro = updateImpresionLadoTinta(
      updateImpresionLadoTinta(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        0,
        7
      ),
      1,
      7
    )

    const precioColorBasico = 17500
    const precioPantone = 50000

    expect(
      computeImpresionPrecioTinta(
        tiro,
        retiro,
        2500,
        precioColorBasico,
        precioPantone
      )
    ).toBe(500_000)
  })

  it('calcula solo Color básico: NO-Pantone distintos × tamaños buenos/1000 × Precio Color básico', () => {
    // nonPantoneCount = 1 (un solo color distinto NO-Pantone)
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      0
    )
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)

    const precioColorBasico = 17500
    const precioPantone = 50000

    // factorBase = 1 * (2500/1000) = 2.5 → redondeo decimal ≥ 0.2 → 3 millares
    expect(
      computeImpresionPrecioTinta(tiro, retiro, 2500, precioColorBasico, precioPantone)
    ).toBe(52_500)
  })

  it('aplica redondeo decimal con umbral 0,2 en millares bajos', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1) // [0]
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)

    const precioColorBasico = 17500
    const precioPantone = 50000

    // factorBase = 1 * (500/1000) = 0,5 → decimal > 0,2 → 1 millar
    expect(
      computeImpresionPrecioTinta(tiro, retiro, 500, precioColorBasico, precioPantone)
    ).toBe(17_500)
  })

  it('devuelve 0 si no hay Pantone ni NO-Pantone', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 0)
    expect(computeImpresionPrecioTinta(tiro, retiro, 2500, 17500, 50000)).toBe(0)
  })
})

