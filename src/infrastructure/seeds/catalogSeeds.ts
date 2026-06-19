import { CortePapel, type DespieceAsociado } from '../../core/domain/entities/CortePapel.js'
import { DespiecePliego } from '../../core/domain/entities/DespiecePliego.js'
import { PrecioMontaje } from '../../core/domain/entities/PrecioMontaje.js'
import { TamanoPlancha } from '../../core/domain/entities/TamanoPlancha.js'
import { TarifaMillar } from '../../core/domain/entities/TarifaMillar.js'

/** Registro de catálogo simple (Terminados / Operaciones). */
export interface CatalogRecordSeed {
  id: string
  name: string
  quickAccess?: boolean
  cost?: string
  valorCmCuadrado?: string
}

export interface DespieceAsociadoSeed {
  despieceId: string
  name: string
  ancho: string
  alto: string
  unidadMedida: string
  piezasPorPliego: number
}

export interface CortePapelSeed {
  id: string
  name: string
  ancho: string
  alto: string,
  unidadMedida: string
  tipoPapelId: string
  despieces: DespieceAsociadoSeed[]
}

export const TERMINADOS_SEED: CatalogRecordSeed[] = [
  { id: 't1', name: 'Brillo UV', quickAccess: true, cost: '18.000', valorCmCuadrado: '1200' },
  { id: 't2', name: 'Laminado mate', quickAccess: true, cost: '22.000', valorCmCuadrado: '1500' },
  { id: 't3', name: 'Laminado brillante', quickAccess: true, cost: '24.000', valorCmCuadrado: '1600' },
  { id: 't4', name: 'Estampado', quickAccess: true, cost: '35.000', valorCmCuadrado: '2800', clise: '0' },
  { id: 't5', name: 'Reserva UV', quickAccess: true, cost: '28.000', valorCmCuadrado: '2200', positivo: '0' },
  { id: 't6', name: 'Encaucheteado', quickAccess: true, cost: '12.000', valorCmCuadrado: '0800' },
  { id: 't7', name: 'Troquel existente', cost: '45.000', valorCmCuadrado: '3500' },
  { id: 't8', name: 'Troquel nuevo', cost: '120.000', valorCmCuadrado: '9000' },
  { id: 't9', name: 'Pretroquelado', cost: '55.000', valorCmCuadrado: '4200' },
  { id: 't10', name: 'Grafado', cost: '15.000', valorCmCuadrado: '1000' },
]

export const OPERACIONES_SEED: CatalogRecordSeed[] = [
  { id: 'o1', name: 'Levantar', cost: '3.500', valorCmCuadrado: '3500' },
  { id: 'o2', name: 'Contar', cost: '2.800', valorCmCuadrado: '2800' },
  { id: 'o3', name: 'Plegar', quickAccess: true, cost: '4.200', valorCmCuadrado: '4200' },
  { id: 'o4', name: 'Embolcar', quickAccess: true, cost: '3.800', valorCmCuadrado: '3800' },
  { id: 'o5', name: 'Sanduchar', cost: '5.500', valorCmCuadrado: '5500' },
  { id: 'o6', name: 'Argollar', quickAccess: true, cost: '6.200', valorCmCuadrado: '6200' },
  { id: 'o7', name: 'Coser', cost: '7.500', valorCmCuadrado: '7500' },
  { id: 'o8', name: 'Despuntar', cost: '2.500', valorCmCuadrado: '2500' },
  { id: 'o9', name: 'Perforar', cost: '4.800', valorCmCuadrado: '4800' },
  { id: 'o10', name: 'Descolillar', cost: '3.200', valorCmCuadrado: '3200' },
  { id: 'o11', name: 'Refile final', cost: '4.500', valorCmCuadrado: '4500' },
  { id: 'o12', name: 'Empaque', quickAccess: true, cost: '5.000', valorCmCuadrado: '5000' },
]

export const DESPIECE_PLIEGO_SEED = [
  { id: 'dp-1', name: 'Etiqueta', ancho: '10', alto: '5', unidadMedida: 'cm', piezasPorPliego: 24, active: true },
  { id: 'dp-2', name: 'Tarjeta', ancho: '9', alto: '5', unidadMedida: 'cm', piezasPorPliego: 32, active: true },
  { id: 'dp-3', name: 'Flyer', ancho: '21', alto: '14.8', unidadMedida: 'cm', piezasPorPliego: 4, active: true },
  { id: 'dp-4', name: 'Folder', ancho: '22', alto: '28', unidadMedida: 'cm', piezasPorPliego: 2, active: false },
] as const

export const CORTE_PAPEL_SEED: CortePapelSeed[] = [
  {
    id: 'cp-1',
    name: 'Corte etiqueta',
    ancho: '70',
    alto: '100',
    unidadMedida: 'cm',
    tipoPapelId: 'papel-1',
    despieces: [
      { despieceId: 'dp-1', name: 'Etiqueta', ancho: '10', alto: '5', unidadMedida: 'cm', piezasPorPliego: 24 },
    ],
  },
  {
    id: 'cp-2',
    name: 'Corte tarjeta',
    ancho: '77',
    alto: '110',
    unidadMedida: 'cm',
    tipoPapelId: 'papel-3',
    despieces: [
      { despieceId: 'dp-2', name: 'Tarjeta', ancho: '9', alto: '5', unidadMedida: 'cm', piezasPorPliego: 32 },
    ],
  },
  {
    id: 'cp-3',
    name: 'Corte flyer',
    ancho: '70',
    alto: '100',
    unidadMedida: 'cm',
    tipoPapelId: 'papel-1',
    despieces: [
      { despieceId: 'dp-3', name: 'Flyer', ancho: '21', alto: '14.8', unidadMedida: 'cm', piezasPorPliego: 4 },
    ],
  },
  {
    id: 'cp-4',
    name: 'Corte invitación',
    ancho: '64',
    alto: '90',
    unidadMedida: 'cm',
    tipoPapelId: 'papel-2',
    despieces: [
      { despieceId: 'dp-2', name: 'Tarjeta', ancho: '9', alto: '5', unidadMedida: 'cm', piezasPorPliego: 32 },
    ],
  },
  {
    id: 'cp-5',
    name: 'Corte packaging',
    ancho: '77',
    alto: '110',
    unidadMedida: 'cm',
    tipoPapelId: 'papel-3',
    despieces: [
      { despieceId: 'dp-1', name: 'Etiqueta', ancho: '10', alto: '5', unidadMedida: 'cm', piezasPorPliego: 24 },
    ],
  },
]

export const TAMANO_PLANCHA_SEED = [
  { id: 'tp1', name: 'Plancha estándar', ancho: '70', alto: '100', unidadMedida: 'cm', valor: 185000, active: true },
  { id: 'tp2', name: 'Plancha media', ancho: '64', alto: '90', unidadMedida: 'cm', valor: 152000, active: true },
  { id: 'tp3', name: 'Plancha pequeña', ancho: '50', alto: '70', unidadMedida: 'cm', valor: 98000, active: true },
  { id: 'tp4', name: 'Plancha gran formato', ancho: '100', alto: '140', unidadMedida: 'cm', valor: 265000, active: false },
] as const

export const PRECIO_MONTAJE_SEED = [
  { id: 'pm-1', name: 'Montaje estándar 4 tintas', cost: 85000, state: true },
  { id: 'pm-2', name: 'Montaje complejo 6 tintas', cost: 125000, state: true },
  { id: 'pm-3', name: 'Montaje económico 2 tintas', cost: 55000, state: true },
  { id: 'pm-4', name: 'Montaje especial laminado', cost: 158000, state: true },
] as const

export const TARIFA_MILLAR_SEED = [
  {
    id: 'tm-1',
    name: 'Color básico',
    unidadMedida: 1000,
    precio: 17500,
    categoria: 'Colores',
    descripcion:
      'Impresión estándar en cuatricromía (CMYK), utilizada para la mayoría de trabajos comunes.',
    state: true,
    millarMinimoVenta: 500,
    topeMinimoMillar: 600,
    umbralDecimalMillar: 0.2,
    precioVolteoPinza: 20_000,
    precioVolteoEscuadra: 20_000,
  },
  {
    id: 'tm-4',
    name: 'Pantone',
    unidadMedida: 1000,
    precio: 50000,
    categoria: 'Colores',
    descripcion:
      'Tinta directa especial que asegura fidelidad exacta de color en logotipos y marcas corporativas.',
    state: true,
    millarMinimoVenta: 500,
    topeMinimoMillar: 600,
    umbralDecimalMillar: 0.2,
    precioVolteoPinza: 70_000,
    precioVolteoEscuadra: 70_000,
  },
] as const

const toDespieceAsociado = (d: DespieceAsociadoSeed): DespieceAsociado => ({ ...d })

export const createDespiecePliegoSeeds = (): DespiecePliego[] =>
  DESPIECE_PLIEGO_SEED.map(
    s =>
      new DespiecePliego(
        s.id,
        s.name,
        s.ancho,
        s.alto,
        s.unidadMedida,
        s.piezasPorPliego,
        s.active
      )
  )

export const createCortePapelSeeds = (): CortePapel[] =>
  CORTE_PAPEL_SEED.map(
    s =>
      new CortePapel(
        s.id,
        s.name,
        s.ancho,
        s.alto,
        s.unidadMedida,
        s.despieces.map(toDespieceAsociado),
        s.tipoPapelId
      )
  )

export const createTamanoPlanchaSeeds = (): TamanoPlancha[] =>
  TAMANO_PLANCHA_SEED.map(
    s =>
      new TamanoPlancha(s.id, s.name, s.ancho, s.alto, s.unidadMedida, s.valor, s.active)
  )

export const createPrecioMontajeSeeds = (): PrecioMontaje[] =>
  PRECIO_MONTAJE_SEED.map(s => new PrecioMontaje(s.id, s.name, s.cost, s.state))

export const createTarifaMillarSeeds = (): TarifaMillar[] =>
  TARIFA_MILLAR_SEED.map(
    s =>
      new TarifaMillar(
        s.id,
        s.name,
        s.unidadMedida,
        s.precio,
        s.categoria,
        s.descripcion,
        s.state,
        s.millarMinimoVenta,
        s.topeMinimoMillar,
        s.umbralDecimalMillar,
        s.precioVolteoPinza,
        s.precioVolteoEscuadra
      )
  )
