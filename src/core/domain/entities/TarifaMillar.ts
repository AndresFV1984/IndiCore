export const TARIFA_MILLAR_CATEGORIAS = ['Colores'] as const
export type TarifaMillarCategoria = (typeof TARIFA_MILLAR_CATEGORIAS)[number]
export const DEFAULT_TARIFA_MILLAR_CATEGORIA: TarifaMillarCategoria = 'Colores'
export const TARIFA_MILLAR_UNIDAD = 1000
export const DEFAULT_UMBRAL_DECIMAL_MILLAR = 0.2
export const DEFAULT_MILLAR_MINIMO_VENTA = 500
export const DEFAULT_TOPE_MINIMO_MILLAR = 600

export interface TarifaMillarPricing {
  precio: number
  millarMinimoVenta: number
  topeMinimoMillar: number
  umbralDecimalMillar: number
}

export const describeTarifaMillarReglaDecimales = (
  umbral = DEFAULT_UMBRAL_DECIMAL_MILLAR
): string =>
  `Si la parte decimal es mayor a ${umbral.toLocaleString('es-CO')}, sube al entero siguiente más cercano; en caso contrario, conserva solo la parte entera.`

const normalizePricingNumber = (value: number | undefined, fallback: number): number =>
  typeof value === 'number' && value >= 0 ? value : fallback

export class TarifaMillar {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly unidadMedida: number,
    public readonly precio: number,
    public readonly categoria: string,
    public readonly descripcion: string,
    public readonly state: boolean = true,
    public readonly millarMinimoVenta: number = DEFAULT_MILLAR_MINIMO_VENTA,
    public readonly topeMinimoMillar: number = DEFAULT_TOPE_MINIMO_MILLAR,
    public readonly umbralDecimalMillar: number = DEFAULT_UMBRAL_DECIMAL_MILLAR,
    public readonly precioVolteoPinza: number = 0,
    public readonly precioVolteoEscuadra: number = 0
  ) {}

  get pricing(): TarifaMillarPricing {
    return {
      precio: this.precio,
      millarMinimoVenta: this.millarMinimoVenta,
      topeMinimoMillar: this.topeMinimoMillar,
      umbralDecimalMillar: this.umbralDecimalMillar,
    }
  }

  static create(dto: CreateTarifaMillarDTO) {
    return new TarifaMillar(
      dto.id || crypto.randomUUID(),
      dto.name,
      TARIFA_MILLAR_UNIDAD,
      dto.precio ?? 0,
      dto.categoria?.trim() || DEFAULT_TARIFA_MILLAR_CATEGORIA,
      dto.descripcion?.trim() || '',
      dto.state ?? true,
      normalizePricingNumber(dto.millarMinimoVenta, DEFAULT_MILLAR_MINIMO_VENTA),
      normalizePricingNumber(dto.topeMinimoMillar, DEFAULT_TOPE_MINIMO_MILLAR),
      normalizePricingNumber(dto.umbralDecimalMillar, DEFAULT_UMBRAL_DECIMAL_MILLAR),
      normalizePricingNumber(dto.precioVolteoPinza, 0),
      normalizePricingNumber(dto.precioVolteoEscuadra, 0)
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
  millarMinimoVenta?: number
  topeMinimoMillar?: number
  umbralDecimalMillar?: number
  precioVolteoPinza?: number
  precioVolteoEscuadra?: number
}
