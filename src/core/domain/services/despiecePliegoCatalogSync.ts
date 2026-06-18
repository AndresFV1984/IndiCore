import type { DespieceAsociado } from '../entities/CortePapel.js'
import type { DespiecePliego } from '../entities/DespiecePliego.js'

export const toDespieceAsociadoFromCatalog = (
  catalog: Pick<
    DespiecePliego,
    'id' | 'name' | 'ancho' | 'alto' | 'unidadMedida' | 'piezasPorPliego'
  >,
  existing?: DespieceAsociado
): DespieceAsociado => ({
  despieceId: catalog.id,
  name: catalog.name,
  ancho: catalog.ancho,
  alto: catalog.alto,
  unidadMedida: catalog.unidadMedida,
  piezasPorPliego: catalog.piezasPorPliego,
  valorCorte: existing?.valorCorte,
})

export const syncDespieceAsociadoList = (
  despieces: DespieceAsociado[],
  updated: Pick<
    DespiecePliego,
    'id' | 'name' | 'ancho' | 'alto' | 'unidadMedida' | 'piezasPorPliego'
  >
): DespieceAsociado[] =>
  despieces.map(d =>
    d.despieceId === updated.id ? toDespieceAsociadoFromCatalog(updated, d) : d
  )
