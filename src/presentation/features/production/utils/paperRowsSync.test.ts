import { describe, expect, it } from 'vitest'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import { emptyPaperRow } from './tipoPapelDisplay'
import {
  buildCorteResumenConsolidado,
  formatColoresPlanchaRegistroLabel,
  formatColoresPlanchaRegistroSelectLabel,
  isCorteRegistroCompleto,
  resolveOrderCortePapelMetrics,
  syncPaperRowsWithColoresPlanchas,
} from './paperRowsSync'

const baseItem = (id: string, detalle: string): DisenoColorPlanchaItem => ({
  id,
  colores: '2-colores',
  planchaId: 'p1',
  planchaNombreMedida: '70×100',
  planchaValor: 100000,
  cantidad: 2400,
  numeroCavidades: 2,
  tamanosBuenos: 1200,
  sobrante: 0,
  numeroPlanchas: 2,
  valorTotal: 200000,
  detalle,
  observacion: '',
})

describe('formatColoresPlanchaRegistroSelectLabel', () => {
  it('muestra tipo plancha y descripción sin prefijo de registro', () => {
    expect(formatColoresPlanchaRegistroSelectLabel(baseItem('a', 'Tapa frontal'))).toBe(
      '70×100 · Tapa frontal'
    )
  })

  it('indica sin descripción si el registro no tiene detalle', () => {
    expect(formatColoresPlanchaRegistroSelectLabel(baseItem('a', ''))).toBe(
      '70×100 · Sin descripción'
    )
  })
})

describe('formatColoresPlanchaRegistroLabel', () => {
  it('incluye número de registro para resumen y banner', () => {
    expect(formatColoresPlanchaRegistroLabel(baseItem('a', 'Tapa frontal'), 0)).toBe(
      'Registro 1 — 70×100 · Tapa frontal'
    )
  })
})

describe('syncPaperRowsWithColoresPlanchas', () => {
  it('crea una fila por cada registro de preprensa', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const rows = syncPaperRowsWithColoresPlanchas(colores, [])
    expect(rows).toHaveLength(2)
    expect(rows[0]?.colorPlanchaId).toBe('a')
    expect(rows[1]?.colorPlanchaId).toBe('b')
  })

  it('conserva datos de fila existente al sincronizar', () => {
    const colores = [baseItem('a', 'Frente')]
    const rows = syncPaperRowsWithColoresPlanchas(colores, [
      { ...emptyPaperRow('a'), type: 'Couché', tipoPapelId: 'tp-1' },
    ])
    expect(rows[0]?.type).toBe('Couché')
    expect(rows[0]?.tipoPapelId).toBe('tp-1')
  })
})

describe('resolveOrderCortePapelMetrics', () => {
  it('suma métricas de todos los registros en modo papel no suministrado', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const paperRows = [
      {
        ...emptyPaperRow('a'),
        tipoPapelId: 'tp',
        valorHoja: 100,
        unidadEmpaque: 250,
        valorCorteUnitario: 10,
        despiece: {
          despieceId: 'd1',
          name: 'Etiqueta',
          ancho: '10',
          alto: '5',
          unidadMedida: 'cm',
          piezasPorPliego: 24,
          valorCorte: 10,
        },
      },
      {
        ...emptyPaperRow('b'),
        tipoPapelId: 'tp',
        valorHoja: 100,
        unidadEmpaque: 250,
        valorCorteUnitario: 10,
        despiece: {
          despieceId: 'd1',
          name: 'Etiqueta',
          ancho: '10',
          alto: '5',
          unidadMedida: 'cm',
          piezasPorPliego: 24,
          valorCorte: 10,
        },
      },
    ]
    const metrics = resolveOrderCortePapelMetrics(colores, paperRows, [], 2, 'no')
    expect(metrics.cantidadHojas).toBeGreaterThan(0)
    expect(metrics.valorCorte).toBeGreaterThan(0)
    expect(metrics.valorPapel).toBeGreaterThan(0)
  })
})

const paperRowCompleto = (colorPlanchaId: string) => ({
  ...emptyPaperRow(colorPlanchaId),
  tipoPapelId: 'tp',
  valorHoja: 100,
  unidadEmpaque: 250,
  valorCorteUnitario: 10,
  despiece: {
    despieceId: 'd1',
    name: 'Etiqueta',
    ancho: '10',
    alto: '5',
    unidadMedida: 'cm',
    piezasPorPliego: 24,
    valorCorte: 10,
  },
})

describe('isCorteRegistroCompleto', () => {
  it('marca completo con tipo de papel, despiece y cantidad hojas calculable', () => {
    const colores = [baseItem('a', 'Frente')]
    const row = paperRowCompleto('a')
    expect(isCorteRegistroCompleto(row, colores, [], 2, 'no')).toBe(true)
  })

  it('no marca completo sin tipo de papel o despiece', () => {
    const colores = [baseItem('a', 'Frente')]
    expect(isCorteRegistroCompleto(emptyPaperRow('a'), colores, [], 2, 'no')).toBe(false)
    expect(
      isCorteRegistroCompleto({ ...paperRowCompleto('a'), despiece: undefined }, colores, [], 2, 'no')
    ).toBe(false)
  })
})

describe('buildCorteResumenConsolidado', () => {
  it('incluye una línea por registro y suma los totales', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const paperRows = colores.map(item => paperRowCompleto(item.id))
    const resumen = buildCorteResumenConsolidado(colores, paperRows, [], 2, 'no')
    expect(resumen.registros).toHaveLength(2)
    expect(resumen.registros.every(r => r.completo)).toBe(true)
    expect(resumen.registros[0]?.label).toBe('Registro 1 — 70×100 · Frente')
    expect(resumen.registros[0]?.piezasPorPliego).toBe(24)
    expect(resumen.registros[0]?.valorCorteUnitario).toBe(10)
    expect(resumen.totales.cantidadHojas).toBe(
      resumen.registros[0]!.cantidadHojas + resumen.registros[1]!.cantidadHojas
    )
    expect(resumen.totales.valorCorte).toBe(
      resumen.registros[0]!.valorCorte + resumen.registros[1]!.valorCorte
    )
  })

  it('en cliente suministra papel cortado lista registros completos sin valor papel ni corte', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const paperRows = colores.map(item => ({
      ...paperRowCompleto(item.id),
      hojasEntregadasCliente: 500,
      tamanosBuenosManual: 1200,
    }))
    const resumen = buildCorteResumenConsolidado(colores, paperRows, [], 2, 'si')
    expect(resumen.registros).toHaveLength(2)
    expect(resumen.registros.every(r => r.valorPapel === 0)).toBe(true)
    expect(resumen.registros.every(r => r.completo)).toBe(true)
    expect(resumen.totales.valorPapel).toBe(0)
    expect(resumen.totales.valorCorte).toBe(0)
  })

  it('en cliente suministra papel cortado requiere hojas entregadas y tamaños buenos', () => {
    const colores = [baseItem('a', 'Frente')]
    const row = paperRowCompleto('a')
    expect(isCorteRegistroCompleto(row, colores, [], 2, 'si')).toBe(false)
    expect(
      isCorteRegistroCompleto({ ...row, hojasEntregadasCliente: 400 }, colores, [], 2, 'si')
    ).toBe(false)
    expect(
      isCorteRegistroCompleto(
        { ...row, hojasEntregadasCliente: 400, tamanosBuenosManual: 1200 },
        colores,
        [],
        2,
        'si'
      )
    ).toBe(true)
  })

  it('en cliente suministra papel sin cortar requiere hojas entregadas y tamaños buenos', () => {
    const colores = [baseItem('a', 'Frente')]
    const row = {
      ...paperRowCompleto('a'),
      papelCortado: 'no' as const,
      hojasEntregadasCliente: 0,
      tamanosBuenosManual: 0,
    }
    expect(isCorteRegistroCompleto(row, colores, [], 2, 'si')).toBe(false)
    expect(
      isCorteRegistroCompleto(
        { ...row, hojasEntregadasCliente: 100, tamanosBuenosManual: 1200 },
        colores,
        [],
        2,
        'si'
      )
    ).toBe(true)
  })
})
