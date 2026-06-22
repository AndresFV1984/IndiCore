import { TipoPapel } from '../../core/domain/entities/TipoPapel.js'
import type { DespieceAsociado } from '../../core/domain/entities/CortePapel.js'
import type { DespieceAsociadoSeed } from './catalogSeeds.js'

export interface TipoPapelSeed {
  id: string
  name: string
  ancho: string
  alto: string
  unidadMedida: string
  valorHoja: number
  unidadEmpaque: number
  valorCorte: number
  esmaltado: boolean
  active: boolean
  despiecesPliego: DespieceAsociadoSeed[]
}

/** Registros iniciales del directorio Tipo de papel. */
export const TIPO_PAPEL_SEED: TipoPapelSeed[] = [
  {
    id: 'papel-1',
    name: 'Couché brillante',
    ancho: '70',
    alto: '100',
    unidadMedida: 'cm',
    valorHoja: 1250,
    unidadEmpaque: 250,
    valorCorte: 420,
    esmaltado: true,
    active: true,
    despiecesPliego: [
      {
        despieceId: 'dp-3',
        name: 'Flyer',
        ancho: '21',
        alto: '14.8',
        unidadMedida: 'cm',
        piezasPorPliego: 4,
      },
      {
        despieceId: 'dp-1',
        name: 'Etiqueta',
        ancho: '10',
        alto: '5',
        unidadMedida: 'cm',
        piezasPorPliego: 24,
      },
    ],
  },
  {
    id: 'papel-2',
    name: 'Bond offset',
    ancho: '64',
    alto: '90',
    unidadMedida: 'cm',
    valorHoja: 890,
    unidadEmpaque: 500,
    valorCorte: 380,
    esmaltado: false,
    active: true,
    despiecesPliego: [
      {
        despieceId: 'dp-2',
        name: 'Tarjeta',
        ancho: '9',
        alto: '5',
        unidadMedida: 'cm',
        piezasPorPliego: 32,
      },
    ],
  },
  {
    id: 'papel-3',
    name: 'Cartulina sulfatada',
    ancho: '77',
    alto: '110',
    unidadMedida: 'cm',
    valorHoja: 2100,
    unidadEmpaque: 100,
    valorCorte: 550,
    esmaltado: true,
    active: true,
    despiecesPliego: [
      {
        despieceId: 'dp-1',
        name: 'Etiqueta',
        ancho: '10',
        alto: '5',
        unidadMedida: 'cm',
        piezasPorPliego: 24,
      },
    ],
  },
  {
    id: 'papel-4',
    name: 'Papel kraft',
    ancho: '90',
    alto: '120',
    unidadMedida: 'cm',
    valorHoja: 650,
    unidadEmpaque: 200,
    valorCorte: 290,
    esmaltado: false,
    active: false,
    despiecesPliego: [
      {
        despieceId: 'dp-4',
        name: 'Folder',
        ancho: '22',
        alto: '28',
        unidadMedida: 'cm',
        piezasPorPliego: 2,
      },
    ],
  },
]

const toDespieceAsociado = (
  d: DespieceAsociadoSeed,
  valorCorte: number
): DespieceAsociado => ({ ...d, valorCorte })

export const createTipoPapelSeeds = (): TipoPapel[] =>
  TIPO_PAPEL_SEED.map(
    s =>
      new TipoPapel(
        s.id,
        s.name,
        s.ancho,
        s.alto,
        s.unidadMedida,
        s.valorHoja,
        s.unidadEmpaque,
        s.valorCorte,
        s.esmaltado,
        s.active,
        s.despiecesPliego.map(d => toDespieceAsociado(d, s.valorCorte))
      )
  )
