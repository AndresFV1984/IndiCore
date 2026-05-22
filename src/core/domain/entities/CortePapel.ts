import {
  composeMedida,
  resolveMedidaInput,
  type MedidaDimension,
} from '../value-objects/MedidaDimensions.js'

export interface DespieceAsociado {
  despieceId: string
  name: string
  ancho: string
  alto: string
  unidadMedida: string
  piezasPorPliego: number
}

export function despieceAsociadoMedida(d: DespieceAsociado): string {
  return composeMedida(d.ancho, d.alto, d.unidadMedida)
}

export class CortePapel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ancho: string,
    public readonly alto: string,
    public readonly unidadMedida: string,
    public readonly despieces: DespieceAsociado[]
  ) {}

  get medida(): string {
    return composeMedida(this.ancho, this.alto, this.unidadMedida)
  }

  get medidaDimension(): MedidaDimension {
    return { ancho: this.ancho, alto: this.alto, unidadMedida: this.unidadMedida }
  }

  static create(dto: CreateCortePapelDTO): CortePapel {
    const dim = resolveMedidaInput(dto)
    return new CortePapel(
      dto.id || crypto.randomUUID(),
      dto.name,
      dim.ancho,
      dim.alto,
      dim.unidadMedida,
      dto.despieces ?? []
    )
  }
}

export interface CreateCortePapelDTO {
  id?: string
  name: string
  medida?: string
  ancho?: string
  alto?: string
  unidadMedida?: string
  despieces?: DespieceAsociado[]
}
