import {
  composeMedida,
  resolveMedidaInput,
  type MedidaDimension,
} from '../value-objects/MedidaDimensions.js'

export class TamanoPlancha {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ancho: string,
    public readonly alto: string,
    public readonly unidadMedida: string,
    public readonly valor: number,
    public readonly active: boolean = true
  ) {}

  get medida(): string {
    return composeMedida(this.ancho, this.alto, this.unidadMedida)
  }

  get medidaDimension(): MedidaDimension {
    return { ancho: this.ancho, alto: this.alto, unidadMedida: this.unidadMedida }
  }

  static create(dto: CreateTamanoPlanchaDTO): TamanoPlancha {
    const dim = resolveMedidaInput(dto)
    return new TamanoPlancha(
      dto.id || crypto.randomUUID(),
      dto.name,
      dim.ancho,
      dim.alto,
      dim.unidadMedida,
      dto.valor ?? 0,
      dto.active ?? true
    )
  }
}

export interface CreateTamanoPlanchaDTO {
  id?: string
  name: string
  medida?: string
  ancho?: string
  alto?: string
  unidadMedida?: string
  valor?: number
  active?: boolean
}
