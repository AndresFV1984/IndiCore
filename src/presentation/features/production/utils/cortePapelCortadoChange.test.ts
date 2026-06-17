import { describe, expect, it } from 'vitest'
import type { PaperRow } from '../../../../core/domain/entities/Order'
import { createFaltanteLitografiaRow } from './cortePapelFaltante'
import { emptyPaperRow } from './tipoPapelDisplay'
import {
  applyPapelCortadoToRow,
  cortePapelRowHasEstadoCorteContent,
  corteRegistroHasEstadoCorteContent,
  removeCorteRegistroFromPaperRows,
} from './cortePapelCortadoChange'

const registroId = 'cp-1'

describe('cortePapelRowHasEstadoCorteContent', () => {
  it('no cuenta solo el estado sin cortar', () => {
    expect(
      cortePapelRowHasEstadoCorteContent({
        ...emptyPaperRow(registroId),
        papelCortado: 'no',
      })
    ).toBe(false)
  })

  it('detecta tipo de papel y cantidades', () => {
    expect(
      cortePapelRowHasEstadoCorteContent({
        ...emptyPaperRow(registroId),
        tipoPapelId: 'tp',
      })
    ).toBe(true)
    expect(
      cortePapelRowHasEstadoCorteContent({
        ...emptyPaperRow(registroId),
        hojasEntregadasCliente: 10,
      })
    ).toBe(true)
  })
})

describe('corteRegistroHasEstadoCorteContent', () => {
  it('detecta borrador, fila guardada y faltante vinculado', () => {
    const draft: PaperRow = { ...emptyPaperRow(registroId), tipoPapelId: 'tp' }
    expect(corteRegistroHasEstadoCorteContent(registroId, [], draft)).toBe(true)

    const saved: PaperRow[] = [{ ...emptyPaperRow(registroId), tamanosBuenosManual: 100 }]
    expect(corteRegistroHasEstadoCorteContent(registroId, saved)).toBe(true)

    const parent = { ...emptyPaperRow(registroId), tipoPapelId: 'tp' }
    const faltante = createFaltanteLitografiaRow(parent, registroId, 20)
    expect(corteRegistroHasEstadoCorteContent(registroId, [parent, faltante])).toBe(true)
  })
})

describe('applyPapelCortadoToRow', () => {
  it('reinicia el registro conservando el id y el nuevo estado', () => {
    const row: PaperRow = {
      ...emptyPaperRow(registroId),
      tipoPapelId: 'tp',
      type: 'Couché',
      hojasEntregadasCliente: 40,
      tamanosBuenosManual: 1200,
      papelCortado: 'si',
    }
    const next = applyPapelCortadoToRow(row, 'no')
    expect(next.colorPlanchaId).toBe(registroId)
    expect(next.papelCortado).toBe('no')
    expect(next.tipoPapelId).toBe('')
    expect(next.hojasEntregadasCliente).toBe(0)
    expect(next.tamanosBuenosManual).toBe(0)
  })
})

describe('removeCorteRegistroFromPaperRows', () => {
  it('elimina el padre y su faltante', () => {
    const parent = { ...emptyPaperRow(registroId), tipoPapelId: 'tp' }
    const faltante = createFaltanteLitografiaRow(parent, registroId, 15)
    const other = { ...emptyPaperRow('cp-2'), tipoPapelId: 'tp2' }
    const rows = removeCorteRegistroFromPaperRows([parent, faltante, other], registroId)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.colorPlanchaId).toBe('cp-2')
  })
})
