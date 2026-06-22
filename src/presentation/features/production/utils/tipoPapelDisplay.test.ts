import { describe, expect, it } from 'vitest'
import { TipoPapel } from '../../../../core/domain/entities/TipoPapel'
import type { PaperRow } from '../../../../core/domain/entities/Order'
import {
  emptyPaperRow,
  resolveDespieceForPaperRow,
  resolveDespieceForTipoPapel,
} from './tipoPapelDisplay'

const tipoPapel = new TipoPapel(
  'tp-1',
  'Couché',
  '70',
  '100',
  'cm',
  1000,
  250,
  420,
  true,
  true,
  [
    {
      despieceId: 'dp-1',
      name: 'Flyer',
      ancho: '21',
      alto: '14.8',
      unidadMedida: 'cm',
      piezasPorPliego: 4,
      valorCorte: 50,
    },
  ]
)

describe('resolveDespieceForTipoPapel', () => {
  it('conserva el despiece guardado si el catálogo aún no tiene el match', () => {
    const saved = {
      despieceId: 'dp-1',
      name: 'Flyer guardado',
      ancho: '21',
      alto: '14.8',
      unidadMedida: 'cm',
      piezasPorPliego: 4,
      valorCorte: 50,
    }

    const emptyTipo = new TipoPapel('tp-1', 'Couché', '70', '100', 'cm', 1000, 250, 420, false, true, [])

    expect(resolveDespieceForTipoPapel(saved, emptyTipo)).toEqual(saved)
  })

  it('prioriza el despiece vigente del catálogo cuando existe', () => {
    const saved = {
      despieceId: 'dp-1',
      name: 'Nombre antiguo',
      ancho: '21',
      alto: '14.8',
      unidadMedida: 'cm',
      piezasPorPliego: 4,
      valorCorte: 50,
    }

    expect(resolveDespieceForTipoPapel(saved, tipoPapel)?.name).toBe('Flyer')
  })
})

describe('resolveDespieceForPaperRow', () => {
  it('resuelve despiece por pliego desde tipo de papel y fila de corte', () => {
    const row: PaperRow = {
      ...emptyPaperRow('cp-1'),
      tipoPapelId: 'tp-1',
      despiece: {
        despieceId: 'dp-1',
        name: 'Nombre antiguo',
        ancho: '21',
        alto: '14.8',
        unidadMedida: 'cm',
        piezasPorPliego: 4,
      },
    }

    expect(resolveDespieceForPaperRow(row, [tipoPapel])?.name).toBe('Flyer')
  })
})
