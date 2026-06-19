import { describe, expect, it } from 'vitest'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import type { TerminadosProduccionRegistro } from '../../../../core/domain/entities/Order'
import { emptyPaperRow } from './tipoPapelDisplay'
import { syncPaperRowsWithColoresPlanchas } from './paperRowsSync'
import {
  buildTerminadosAsignadosRows,
  buildTerminadosCobroResumen,
  buildTerminadosCorteContexts,
  createTerminadosProduccionEntrada,
  resolveCompletedTerminadosCorteRowKeys,
  terminadosRegistroMatchesContext,
} from './terminadosUtils'
import { buildTerminadoProduccionLinea, isEstampadoTerminadoLinea, isReservaUvTerminadoLinea } from './terminadosUtils'
import type { CatalogRecord } from '../../catalog/catalogRecord'

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

const terminadoCatalog = (id: string, name: string): CatalogRecord => ({
  id,
  name,
  valorCmCuadrado: '5000',
  cost: '18000',
  quickAccess: false,
})

const completeRow = (colorPlanchaId: string) => ({
  ...emptyPaperRow(colorPlanchaId),
  tipoPapelId: 'tp',
  type: 'Couché',
  valorHoja: 100,
  unidadEmpaque: 250,
  valorCorteUnitario: 10,
  despiece: {
    despieceId: `dp-${colorPlanchaId}`,
    name: `Despiece ${colorPlanchaId}`,
    ancho: '21',
    alto: '14.8',
    unidadMedida: 'cm',
    piezasPorPliego: 4,
    valorCorte: 10,
  },
})

describe('buildTerminadosCorteContexts', () => {
  it('asigna la fila de papel correcta a cada plancha sin corteRowId', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const paperRows = syncPaperRowsWithColoresPlanchas(colores, [
      completeRow('a'),
      completeRow('b'),
    ])

    const contexts = buildTerminadosCorteContexts(colores, paperRows, [], 0, 'no')

    expect(contexts).toHaveLength(2)
    expect(contexts[0]?.row.colorPlanchaId).toBe('a')
    expect(contexts[1]?.row.colorPlanchaId).toBe('b')
    expect(contexts[0]?.corteRowKey).toBe('a')
    expect(contexts[1]?.corteRowKey).toBe('b')
  })

  it('muestra el despiece por pliego configurado en Corte de papel', () => {
    const colores = [baseItem('a', 'Frente')]
    const paperRows = syncPaperRowsWithColoresPlanchas(colores, [completeRow('a')])
    const tiposPapel = [
      {
        id: 'tp',
        name: 'Couché',
        ancho: '70',
        alto: '100',
        unidadMedida: 'cm',
        valorHoja: 100,
        unidadEmpaque: 250,
        valorCorte: 10,
        active: true,
        despiecesPliego: [
          {
            despieceId: 'dp-a',
            name: 'Flyer catálogo',
            ancho: '21',
            alto: '14.8',
            unidadMedida: 'cm',
            piezasPorPliego: 4,
            valorCorte: 10,
          },
        ],
      },
    ] as const

    const contexts = buildTerminadosCorteContexts(colores, paperRows, tiposPapel as never, 0, 'no')

    expect(contexts[0]?.despieceNombre).toBe('Flyer catálogo')
    expect(contexts[0]?.despieceMedida).toContain('21')
  })
})

describe('resolveCompletedTerminadosCorteRowKeys', () => {
  it('marca solo la plancha con terminados confirmados', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const paperRows = syncPaperRowsWithColoresPlanchas(colores, [
      completeRow('a'),
      completeRow('b'),
    ])
    const contexts = buildTerminadosCorteContexts(colores, paperRows, [], 0, 'no')
    const contextA = contexts[0]!
    const linea = buildTerminadoProduccionLinea(
      terminadoCatalog('t1', 'Barniz'),
      contextA.row,
      contextA.tamanosBuenos
    )
    const registros: TerminadosProduccionRegistro[] = [
      {
        corteRowKey: contextA.corteRowKey,
        colorPlanchaId: contextA.row.colorPlanchaId,
        entradas: [createTerminadosProduccionEntrada([linea])],
        completo: true,
      },
    ]

    expect(
      resolveCompletedTerminadosCorteRowKeys(colores, paperRows, [], 0, 'no', registros)
    ).toEqual(['a'])
  })
})
describe('buildTerminadosAsignadosRows', () => {
  it('consolida registros de todas las planchas', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const paperRows = syncPaperRowsWithColoresPlanchas(colores, [
      completeRow('a'),
      completeRow('b'),
    ])
    const contexts = buildTerminadosCorteContexts(colores, paperRows, [], 0, 'no')
    const contextA = contexts[0]!
    const contextB = contexts[1]!
    const lineaA = buildTerminadoProduccionLinea(
      terminadoCatalog('t1', 'Barniz'),
      contextA.row,
      contextA.tamanosBuenos
    )
    const lineaB = buildTerminadoProduccionLinea(
      terminadoCatalog('t2', 'Troquel'),
      contextB.row,
      contextB.tamanosBuenos
    )
    const registros = [
      {
        corteRowKey: contextA.corteRowKey,
        colorPlanchaId: contextA.row.colorPlanchaId,
        entradas: [createTerminadosProduccionEntrada([lineaA])],
        completo: true,
      },
      {
        corteRowKey: contextB.corteRowKey,
        colorPlanchaId: contextB.row.colorPlanchaId,
        entradas: [createTerminadosProduccionEntrada([lineaB])],
        completo: true,
      },
    ]

    const rows = buildTerminadosAsignadosRows(contexts, registros)

    expect(rows).toHaveLength(2)
    expect(rows.map(row => row.corteRowKey)).toEqual(['a', 'b'])
    expect(rows[0]?.planchaLabel).not.toMatch(/^Registro \d+ —/)
    expect(rows[0]?.planchaLabel).toContain('Frente')
  })
})

describe('buildTerminadosCobroResumen', () => {
  it('resume el cobro por plancha y el total consolidado', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const paperRows = syncPaperRowsWithColoresPlanchas(colores, [
      completeRow('a'),
      completeRow('b'),
    ])
    const contexts = buildTerminadosCorteContexts(colores, paperRows, [], 0, 'no')
    const contextA = contexts[0]!
    const contextB = contexts[1]!
    const lineaA = buildTerminadoProduccionLinea(
      terminadoCatalog('t1', 'Barniz'),
      contextA.row,
      contextA.tamanosBuenos
    )
    const lineaB = buildTerminadoProduccionLinea(
      terminadoCatalog('t2', 'Troquel'),
      contextB.row,
      contextB.tamanosBuenos
    )
    const registros = [
      {
        corteRowKey: contextA.corteRowKey,
        colorPlanchaId: contextA.row.colorPlanchaId,
        entradas: [createTerminadosProduccionEntrada([lineaA])],
        completo: true,
      },
      {
        corteRowKey: contextB.corteRowKey,
        colorPlanchaId: contextB.row.colorPlanchaId,
        entradas: [createTerminadosProduccionEntrada([lineaB])],
        completo: true,
      },
    ]

    const resumen = buildTerminadosCobroResumen(contexts, registros)

    expect(resumen.lineas).toHaveLength(2)
    expect(resumen.lineas[0]?.planchaLabel).not.toMatch(/^Registro \d+ —/)
    expect(resumen.lineas[0]?.planchaLabel).toContain('Frente')
    expect(resumen.totalCobro).toBe(
      resumen.lineas.reduce((sum, linea) => sum + linea.totalCobro, 0)
    )
  })
})

describe('buildTerminadoProduccionLinea campos extra', () => {
  it('inicializa positivo desde el catálogo de Reserva UV', () => {
    const colores = [baseItem('a', 'Frente')]
    const paperRows = syncPaperRowsWithColoresPlanchas(colores, [completeRow('a')])
    const contexts = buildTerminadosCorteContexts(colores, paperRows, [], 0, 'no')
    const context = contexts[0]!

    const linea = buildTerminadoProduccionLinea(
      {
        id: 't5',
        name: 'Reserva UV',
        valorCmCuadrado: '2200',
        cost: '28000',
        positivo: '2',
        clise: '4',
      },
      context.row,
      context.tamanosBuenos,
      'catalogo'
    )

    expect(isReservaUvTerminadoLinea(linea)).toBe(true)
    expect(linea.positivo).toBe(2)
    expect(linea.clise).toBeUndefined()
  })

  it('inicializa clise desde el catálogo de Estampado', () => {
    const colores = [baseItem('a', 'Frente')]
    const paperRows = syncPaperRowsWithColoresPlanchas(colores, [completeRow('a')])
    const contexts = buildTerminadosCorteContexts(colores, paperRows, [], 0, 'no')
    const context = contexts[0]!

    const linea = buildTerminadoProduccionLinea(
      {
        id: 't4',
        name: 'Estampado',
        valorCmCuadrado: '2800',
        cost: '35000',
        clise: '4',
      },
      context.row,
      context.tamanosBuenos,
      'catalogo'
    )

    expect(isEstampadoTerminadoLinea(linea)).toBe(true)
    expect(linea.clise).toBe(4)
    expect(linea.positivo).toBeUndefined()
  })
})

describe('terminadosRegistroMatchesContext', () => {
  it('no empareja por colorPlanchaId si el corteRowKey es de otra plancha', () => {
    const colores = [baseItem('a', 'Frente'), baseItem('b', 'Reverso')]
    const paperRows = syncPaperRowsWithColoresPlanchas(colores, [
      completeRow('a'),
      completeRow('b'),
    ])
    const contexts = buildTerminadosCorteContexts(colores, paperRows, [], 0, 'no')
    const registro: TerminadosProduccionRegistro = {
      corteRowKey: 'a',
      colorPlanchaId: 'a',
      entradas: [createTerminadosProduccionEntrada([])],
      completo: true,
    }

    expect(terminadosRegistroMatchesContext(registro, contexts[0]!)).toBe(true)
    expect(terminadosRegistroMatchesContext(registro, contexts[1]!)).toBe(false)
  })
})
