import type { CatalogRecord } from './catalogRecord'

export const TERMINADOS_SEED: CatalogRecord[] = [
  { id: 't1', name: 'Brillo UV', quickAccess: true, cost: '18.000' },
  { id: 't2', name: 'Laminado mate', quickAccess: true, cost: '22.000' },
  { id: 't3', name: 'Laminado brillante', quickAccess: true, cost: '24.000' },
  { id: 't4', name: 'Estampado', quickAccess: true, cost: '35.000' },
  { id: 't5', name: 'Reserva UV', quickAccess: true, cost: '28.000' },
  { id: 't6', name: 'Encaucheteado', quickAccess: true, cost: '12.000' },
  { id: 't7', name: 'Troquel existente', cost: '45.000' },
  { id: 't8', name: 'Troquel nuevo', cost: '120.000' },
  { id: 't9', name: 'Pretroquelado', cost: '55.000' },
  { id: 't10', name: 'Grafado', cost: '15.000' },
]

export const OPERACIONES_SEED: CatalogRecord[] = [
  { id: 'o1', name: 'Levantar', cost: '3.500' },
  { id: 'o2', name: 'Contar', cost: '2.800' },
  { id: 'o3', name: 'Plegar', cost: '4.200' },
  { id: 'o4', name: 'Embolcar', cost: '3.800' },
  { id: 'o5', name: 'Sanduchar', cost: '5.500' },
  { id: 'o6', name: 'Argollar', cost: '6.200' },
  { id: 'o7', name: 'Coser', cost: '7.500' },
  { id: 'o8', name: 'Despuntar', cost: '2.500' },
  { id: 'o9', name: 'Perforar', cost: '4.800' },
  { id: 'o10', name: 'Descolillar', cost: '3.200' },
  { id: 'o11', name: 'Refile final', cost: '4.500' },
  { id: 'o12', name: 'Empaque', cost: '5.000' },
]
