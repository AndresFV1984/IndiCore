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
  /** Valor corte configurado cuando se asocia a un Tipo de papel (opcional para compatibilidad). */
  valorCorte?: number
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
    public readonly despieces: DespieceAsociado[],
    public readonly tipoPapelId: string = ''
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
      dto.despieces ?? [],
      dto.tipoPapelId ?? ''
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
  /** Id en catálogo Tipo de papel */
  tipoPapelId?: string
}
