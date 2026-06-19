import { describe, expect, it } from 'vitest'
import {
  buildCatalogRecordFromFormValues,
  isReservaUvTerminado,
  normalizeCatalogRecordList,
  parseCatalogIntegerField,
} from './catalogRecord'

describe('catalogRecord reserva UV', () => {
  it('identifica Reserva UV por id o nombre', () => {
    expect(isReservaUvTerminado({ id: 't5', name: 'Reserva UV' })).toBe(true)
    expect(isReservaUvTerminado({ id: 'x', name: 'Reserva UV' })).toBe(true)
    expect(isReservaUvTerminado({ id: 't1', name: 'Brillo UV' })).toBe(false)
  })

  it('normaliza positivo y clise en catálogo Reserva UV', () => {
    const items = normalizeCatalogRecordList([
      { id: 't5', name: 'Reserva UV', cost: '28000', valorCmCuadrado: '2200' },
    ])

    expect(items[0]?.positivo).toBe('0')
    expect(items[0]?.clise).toBe('0')
  })

  it('guarda defaults de positivo y clise al editar Reserva UV', () => {
    const record = buildCatalogRecordFromFormValues(
      {
        name: 'Reserva UV',
        quickAccess: true,
        cost: '28000',
        valorCmCuadrado: '2200',
        positivo: '3',
        clise: '5',
      },
      't',
      't5'
    )

    expect(record.positivo).toBe('3')
    expect(record.clise).toBe('5')
    expect(parseCatalogIntegerField(record.positivo)).toBe(3)
  })
})
