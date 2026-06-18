import { describe, expect, it } from 'vitest'
import { DespiecePliego } from '../entities/DespiecePliego.js'
import {
  syncDespieceAsociadoList,
  toDespieceAsociadoFromCatalog,
} from './despiecePliegoCatalogSync.js'

describe('despiecePliegoCatalogSync', () => {
  const catalog = DespiecePliego.create({
    id: 'dp-1',
    name: 'Etiqueta grande',
    ancho: '12',
    alto: '6',
    unidadMedida: 'cm',
    piezasPorPliego: 20,
    active: true,
  })

  it('actualiza datos del catálogo conservando valorCorte', () => {
    const synced = toDespieceAsociadoFromCatalog(catalog, {
      despieceId: 'dp-1',
      name: 'Etiqueta',
      ancho: '10',
      alto: '5',
      unidadMedida: 'cm',
      piezasPorPliego: 24,
      valorCorte: 350,
    })

    expect(synced).toEqual({
      despieceId: 'dp-1',
      name: 'Etiqueta grande',
      ancho: '12',
      alto: '6',
      unidadMedida: 'cm',
      piezasPorPliego: 20,
      valorCorte: 350,
    })
  })

  it('sincroniza solo el despiece coincidente en la lista', () => {
    const synced = syncDespieceAsociadoList(
      [
        {
          despieceId: 'dp-1',
          name: 'Etiqueta',
          ancho: '10',
          alto: '5',
          unidadMedida: 'cm',
          piezasPorPliego: 24,
          valorCorte: 100,
        },
        {
          despieceId: 'dp-2',
          name: 'Tarjeta',
          ancho: '9',
          alto: '5',
          unidadMedida: 'cm',
          piezasPorPliego: 32,
          valorCorte: 200,
        },
      ],
      catalog
    )

    expect(synced[0].name).toBe('Etiqueta grande')
    expect(synced[0].piezasPorPliego).toBe(20)
    expect(synced[0].valorCorte).toBe(100)
    expect(synced[1].name).toBe('Tarjeta')
  })
})
