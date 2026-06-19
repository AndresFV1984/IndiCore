import { describe, expect, it } from 'vitest'
import {
  buildCatalogRecordFromFormValues,
  isEstampadoTerminado,
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

  it('identifica Estampado por id o nombre', () => {
    expect(isEstampadoTerminado({ id: 't4', name: 'Estampado' })).toBe(true)
    expect(isEstampadoTerminado({ id: 'x', name: 'Estampado' })).toBe(true)
    expect(isEstampadoTerminado({ id: 't5', name: 'Reserva UV' })).toBe(false)
  })

  it('normaliza positivo en Reserva UV y clise en Estampado', () => {
    const items = normalizeCatalogRecordList([
      { id: 't5', name: 'Reserva UV', cost: '28000', valorCmCuadrado: '2200', clise: '9' },
      { id: 't4', name: 'Estampado', cost: '35000', valorCmCuadrado: '2800', positivo: '3' },
    ])

    expect(items[0]?.positivo).toBe('0')
    expect(items[0]?.clise).toBeUndefined()
    expect(items[1]?.clise).toBe('0')
    expect(items[1]?.positivo).toBeUndefined()
  })

  it('guarda positivo al editar Reserva UV', () => {
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
    expect(record.clise).toBeUndefined()
    expect(parseCatalogIntegerField(record.positivo)).toBe(3)
  })

  it('guarda clise al editar Estampado', () => {
    const record = buildCatalogRecordFromFormValues(
      {
        name: 'Estampado',
        quickAccess: true,
        cost: '35000',
        valorCmCuadrado: '2800',
        positivo: '3',
        clise: '5',
      },
      't',
      't4'
    )

    expect(record.clise).toBe('5')
    expect(record.positivo).toBeUndefined()
    expect(parseCatalogIntegerField(record.clise)).toBe(5)
  })
})
