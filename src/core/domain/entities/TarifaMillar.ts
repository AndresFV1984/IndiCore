export const TARIFA_MILLAR_CATEGORIAS = ['Colores', 'Volteos'] as const
export type TarifaMillarCategoria = (typeof TARIFA_MILLAR_CATEGORIAS)[number]
export const DEFAULT_TARIFA_MILLAR_CATEGORIA: TarifaMillarCategoria = 'Colores'
export const TARIFA_MILLAR_UNIDAD = 1000

export class TarifaMillar {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly unidadMedida: number,
    public readonly precio: number,
    public readonly categoria: string,
    public readonly descripcion: string,
    public readonly state: boolean = true
  ) {}

  static create(dto: CreateTarifaMillarDTO) {
    return new TarifaMillar(
      dto.id || crypto.randomUUID(),
      dto.name,
      TARIFA_MILLAR_UNIDAD,
      dto.precio ?? 0,
      dto.categoria?.trim() || DEFAULT_TARIFA_MILLAR_CATEGORIA,
      dto.descripcion?.trim() || '',
      dto.state ?? true
    )
  }
}

export interface CreateTarifaMillarDTO {
  id?: string
  name: string
  precio?: number
  categoria?: string
  descripcion?: string
  state?: boolean
}
