import { describe, expect, it } from 'vitest'
import { emptyPreprensaDiseno } from '../../../../core/domain/entities/PreprensaDiseno'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import { emptyPaperRow } from './tipoPapelDisplay'
import { patchRemoveColoresPlanchaRegistro } from './removeColoresPlanchaRegistro'

const item = (id: string, detalle: string): DisenoColorPlanchaItem => ({
  id,
  colores: '2-colores',
  planchaId: 'p1',
  planchaNombreMedida: '70×100',
  planchaValor: 100000,
  cantidad: 1000,
  numeroCavidades: 2,
  tamanosBuenos: 500,
  sobrante: 0,
  numeroPlanchas: 2,
  valorTotal: 200000,
  detalle,
  observacion: '',
})

describe('patchRemoveColoresPlanchaRegistro', () => {
  it('elimina el registro de preprensa y su fila de corte', () => {
    const preprensa = {
      ...emptyPreprensaDiseno(),
      coloresPlanchas: [item('a', 'Frente'), item('b', 'Reverso')],
    }
    const paperRows = [
      { ...emptyPaperRow('a'), type: 'Couché' },
      { ...emptyPaperRow('b'), type: 'Bond' },
    ]

    const result = patchRemoveColoresPlanchaRegistro('a', preprensa, paperRows)

    expect(result.preprensaDiseno.coloresPlanchas).toHaveLength(1)
    expect(result.preprensaDiseno.coloresPlanchas[0]?.id).toBe('b')
    expect(result.paperRows).toHaveLength(1)
    expect(result.paperRows[0]?.colorPlanchaId).toBe('b')
  })
})
