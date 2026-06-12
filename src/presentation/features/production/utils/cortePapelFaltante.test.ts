import { describe, expect, it } from 'vitest'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import { computeCortePapelValores } from './cortePapelCalculations'
import {
  appendFaltanteLitografiaRow,
  createFaltanteLitografiaRow,
  findPaperRowForActiveId,
  resolveHojasCalculadasCorte,
  resolveHojasFaltanteCliente,
  resetPaperRowForActiveId,
  upsertPaperRow,
} from './cortePapelFaltante'

const baseItem = (): DisenoColorPlanchaItem => ({
  id: 'cp-1',
  colores: '2-colores',
  planchaId: 'p1',
  planchaNombreMedida: '70×100',
  planchaValor: 100000,
  cantidad: 5000,
  numeroCavidades: 2,
  tamanosBuenos: 2500,
  sobrante: 100,
  numeroPlanchas: 2,
  valorTotal: 200000,
  detalle: 'Frente',
  observacion: '',
})

const rowBase = () => ({
  colorPlanchaId: 'cp-1',
  tipoPapelId: 'tp',
  type: 'Couché',
  size: '70×100',
  unidadEmpaque: 250,
  valorHoja: 890,
  valorCorteUnitario: 420,
  hojasEntregadasCliente: 400,
  despiece: {
    despieceId: 'd1',
    name: 'Etiqueta',
    ancho: '10',
    alto: '5',
    unidadMedida: 'cm',
    piezasPorPliego: 10,
    valorCorte: 420,
  },
  cut: '',
})

describe('resolveHojasFaltanteCliente', () => {
  it('calcula faltante como cantidad hojas del corte menos entregadas', () => {
    const colores = [baseItem()]
    const row = {
      ...rowBase(),
      tamanosBuenosManual: 5000,
      sobranteManual: 100,
    }
    expect(resolveHojasCalculadasCorte(colores, row, 'si')).toBe(510)
    expect(resolveHojasFaltanteCliente(colores, row, 'si')).toBe(110)
    const conFaltante = { ...row, hojasEntregadasCliente: 200 }
    expect(resolveHojasFaltanteCliente(colores, conFaltante, 'si')).toBe(310)
  })
})

describe('findPaperRowForActiveId', () => {
  it('conserva colorPlanchaId en fallback aunque el id tenga guiones', () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const row = findPaperRowForActiveId([], id)
    expect(row.colorPlanchaId).toBe(id)
  })
})

describe('resetPaperRowForActiveId', () => {
  it('limpia tipo de papel del registro preprensa', () => {
    const registroId = 'registro-preprensa-1'
    const rows = upsertPaperRow([], {
      ...rowBase(),
      colorPlanchaId: registroId,
      tipoPapelId: 'tp-1',
      type: 'Couché',
      despiece: {
        despieceId: 'd-1',
        nombre: 'Despiece',
        piezasPorPliego: 4,
        valorCorte: 1000,
      },
    })
    const reset = resetPaperRowForActiveId(rows, registroId)
    const row = reset.find(r => r.colorPlanchaId === registroId)
    expect(row?.tipoPapelId).toBe('')
    expect(row?.despiece).toBeUndefined()
  })

  it('elimina fila de faltante litografía', () => {
    const parentId = 'registro-preprensa-1'
    const parent = { ...rowBase(), colorPlanchaId: parentId }
    const faltante = createFaltanteLitografiaRow(parent, parentId, 50)
    const rows = upsertPaperRow(upsertPaperRow([], parent), faltante)
    const reset = resetPaperRowForActiveId(rows, faltante.corteRowId!)
    expect(reset.filter(r => r.esFaltanteLitografia)).toHaveLength(0)
  })
})

describe('upsertPaperRow', () => {
  it('no mezcla fila faltante con registro preprensa por id', () => {
    const parentId = 'registro-preprensa-1'
    const parent = { ...rowBase(), colorPlanchaId: parentId }
    const faltante = createFaltanteLitografiaRow(parent, parentId, 50)
    const rows = upsertPaperRow(upsertPaperRow([], parent), faltante)
    expect(rows).toHaveLength(2)
    expect(rows.filter(r => r.esFaltanteLitografia)).toHaveLength(1)
    expect(rows.find(r => !r.esFaltanteLitografia)?.colorPlanchaId).toBe(parentId)
  })
})

describe('appendFaltanteLitografiaRow', () => {
  it('agrega fila faltante y persiste datos del padre', () => {
    const colores = [baseItem()]
    const parent = {
      ...rowBase(),
      colorPlanchaId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      tamanosBuenosManual: 5000,
      sobranteManual: 100,
      hojasEntregadasCliente: 400,
    }
    const result = appendFaltanteLitografiaRow([], parent, 110)
    expect(result).not.toBeNull()
    expect(result!.paperRows).toHaveLength(2)
    const faltante = result!.paperRows.find(r => r.esFaltanteLitografia)
    expect(faltante?.hojasFaltanteCantidad).toBe(110)
    expect(faltante?.tamanosBuenosManual).toBe(1100)
    expect(faltante?.faltanteDeColorPlanchaId).toBe(parent.colorPlanchaId)
  })
})

describe('faltante litografía', () => {
  it('cobra valor papel y corte sobre las hojas faltantes', () => {
    const faltante = createFaltanteLitografiaRow(rowBase(), 'cp-1', 60)
    const valores = computeCortePapelValores({
      coloresPlanchas: [],
      row: faltante,
      margenRedondeo: 2,
      clienteSuministraPapel: 'si',
    })
    expect(valores.cantidadHojas).toBe(60)
    expect(valores.valorPapel).toBeGreaterThan(0)
    expect(valores.valorCorte).toBeGreaterThan(0)
  })
})
