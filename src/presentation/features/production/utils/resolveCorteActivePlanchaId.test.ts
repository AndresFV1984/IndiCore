import { describe, expect, it } from 'vitest'
import { emptyPaperRow } from './tipoPapelDisplay'
import { resolveCorteActivePlanchaId } from './resolveCorteActivePlanchaId'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'

const plancha = (id: string): DisenoColorPlanchaItem =>
  ({
    id,
    colores: '4-colores',
    planchaId: 'p1',
    cantidad: 1000,
    numeroPlanchas: 1,
    valorTotal: 0,
    numeroCavidades: 1,
    detalle: `Registro ${id}`,
    observacion: '',
  }) as DisenoColorPlanchaItem

describe('resolveCorteActivePlanchaId', () => {
  it('selecciona la primera plancha cuando no hay id activo', () => {
    expect(resolveCorteActivePlanchaId('', [plancha('a'), plancha('b')], [])).toBe('a')
  })

  it('mantiene el id activo si sigue siendo válido', () => {
    expect(resolveCorteActivePlanchaId('b', [plancha('a'), plancha('b')], [])).toBe('b')
  })

  it('prioriza la siguiente plancha incompleta', () => {
    const completed = new Set(['a'])
    expect(
      resolveCorteActivePlanchaId('', [plancha('a'), plancha('b')], [], completed)
    ).toBe('b')
  })

  it('vuelve a la primera plancha si todas están completas', () => {
    const completed = new Set(['a', 'b'])
    expect(
      resolveCorteActivePlanchaId('', [plancha('a'), plancha('b')], [], completed)
    ).toBe('a')
  })

  it('puede seleccionar un registro faltante cuando no hay preprensa', () => {
    const rows = [
      {
        ...emptyPaperRow(),
        corteRowId: 'faltante-1',
        esFaltanteLitografia: true,
        faltanteDeColorPlanchaId: 'a',
      },
    ]
    expect(resolveCorteActivePlanchaId('', [], rows)).toBe('faltante-1')
  })
})
