import {
  composeMedida,
  resolveMedidaInput,
  type MedidaDimension,
} from '../value-objects/MedidaDimensions.js'
import { normalizeUnidadEmpaque } from '../value-objects/UnidadEmpaque.js'
import type { DespieceAsociado } from './CortePapel.js'

export class TipoPapel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ancho: string,
    public readonly alto: string,
    public readonly unidadMedida: string,
    public readonly valorHoja: number,
    /** Cantidad de hojas por unidad de empaque. */
    public readonly unidadEmpaque: number,
    public readonly valorCorte: number = 0,
    public readonly esmaltado: boolean = false,
    public readonly active: boolean = true,
    public readonly despiecesPliego: DespieceAsociado[] = []
  ) {}

  get medida(): string {
    return composeMedida(this.ancho, this.alto, this.unidadMedida)
  }

  get medidaDimension(): MedidaDimension {
    return { ancho: this.ancho, alto: this.alto, unidadMedida: this.unidadMedida }
  }

  static create(dto: CreateTipoPapelDTO): TipoPapel {
    const dim = resolveMedidaInput(dto)
    return new TipoPapel(
      dto.id || crypto.randomUUID(),
      dto.name,
      dim.ancho,
      dim.alto,
      dim.unidadMedida,
      dto.valorHoja ?? 0,
      normalizeUnidadEmpaque(dto.unidadEmpaque),
      dto.valorCorte ?? 0,
      dto.esmaltado ?? false,
      dto.active ?? true,
      dto.despiecesPliego ?? []
    )
  }
}

export interface CreateTipoPapelDTO {
  id?: string
  name: string
  /** @deprecated Use ancho, alto, unidadMedida */
  medida?: string
  ancho?: string
  alto?: string
  unidadMedida?: string
  valorHoja?: number
  unidadEmpaque: number
  valorCorte?: number
  esmaltado?: boolean
  active?: boolean
  despiecesPliego?: DespieceAsociado[]
}
