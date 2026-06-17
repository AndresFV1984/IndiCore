import { describe, expect, it } from 'vitest'
import type { PaperRow } from '../../../../core/domain/entities/Order'
import { emptyPaperRow } from './tipoPapelDisplay'
import {
  cortePapelHasRegisteredContent,
  cortePapelRowHasRegisteredContent,
  patchCorteClienteSuministraPapel,
  resetCortePaperRowsForSuministroChange,
} from './corteClienteSuministraPapelChange'

const colores = [
  {
    id: 'cp-1',
    colores: '2-colores' as const,
    planchaId: 'tp1',
    planchaNombreMedida: 'Plancha',
    planchaValor: 1000,
    cantidad: 100,
    numeroCavidades: 2,
    tamanosBuenos: 50,
    sobrante: 0,
    numeroPlanchas: 2,
    valorTotal: 2000,
    detalle: 'Cyan',
    observacion: '',
  },
]

describe('cortePapelHasRegisteredContent', () => {
  it('devuelve false sin filas configuradas', () => {
    expect(cortePapelHasRegisteredContent([emptyPaperRow('cp-1')])).toBe(false)
  })

  it('detecta tipo de papel seleccionado', () => {
    const rows: PaperRow[] = [{ ...emptyPaperRow('cp-1'), tipoPapelId: 'p1', type: 'Couché' }]
    expect(cortePapelHasRegisteredContent(rows)).toBe(true)
  })

  it('detecta borrador en edición sin filas guardadas', () => {
    const draft: PaperRow = { ...emptyPaperRow('cp-1'), tipoPapelId: 'p1', type: 'Couché' }
    expect(cortePapelHasRegisteredContent([], [draft])).toBe(true)
    expect(cortePapelRowHasRegisteredContent(draft)).toBe(true)
  })
})

describe('resetCortePaperRowsForSuministroChange', () => {
  it('reinicia registros al pasar a litografía', () => {
    const rows = resetCortePaperRowsForSuministroChange('no', colores)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.tipoPapelId).toBe('')
    expect(rows[0]?.colorPlanchaId).toBe('cp-1')
  })

  it('reinicia registros al pasar a cliente suministra', () => {
    const rows = resetCortePaperRowsForSuministroChange('si', colores)
    expect(rows[0]?.papelCortado).toBe('si')
    expect(rows[0]?.hojasEntregadasCliente).toBe(0)
    expect(rows[0]?.tipoPapelId).toBe('')
  })
})

describe('patchCorteClienteSuministraPapel', () => {
  it('limpia corte, terminados y acabados al cambiar suministro', () => {
    const currentRows: PaperRow[] = [
      {
        ...emptyPaperRow('cp-1'),
        tipoPapelId: 'p1',
        type: 'Couché',
        despiece: {
          despieceId: 'd1',
          nombre: 'Despiece',
          piezasPorPliego: 4,
        },
      },
    ]
    const patch = patchCorteClienteSuministraPapel('si', colores, currentRows)
    expect(patch.clienteSuministraPapel).toBe('si')
    expect(patch.paperRows?.[0]?.tipoPapelId).toBe('')
    expect(patch.terminadosRegistros).toEqual([])
    expect(patch.acabadosRegistros).toEqual([])
    expect(patch.operations).toEqual([])
  })
})
