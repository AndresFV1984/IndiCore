import {
  composeMedida,
  resolveMedidaInput,
  type MedidaDimension,
} from '../value-objects/MedidaDimensions.js'

export class TipoPapel {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ancho: string,
    public readonly alto: string,
    public readonly unidadMedida: string,
    public readonly valorHoja: number,
    public readonly unidadEmpaque: string,
    public readonly active: boolean = true
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
      dto.unidadEmpaque,
      dto.active ?? true
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
  unidadEmpaque: string
  active?: boolean
}
