export type YesNoChoice = 'si' | 'no'

export type PlanchaClienteTipo = 'cliente-suministra' | 'plancha-existente' | 'plancha-nueva'

/** Cantidad de colores en preprensa (especificaciones técnicas) */
export type DisenoColoresOption =
  | '1-color'
  | '2-colores'
  | '3-colores'
  | '4-colores'
  | '5-colores'
  | '6-colores'
  | '7-colores-o-mas'

/** Registro: color + plancha + cantidades (orden nueva) o cavidades (historial). */
export interface DisenoColorPlanchaItem {
  id: string
  colores: DisenoColoresOption
  planchaId: string
  planchaNombreMedida: string
  /** Precio unitario de la plancha (catálogo) */
  planchaValor: number
  /** Orden nueva: cantidad de trabajo */
  cantidad: number
  /** Cavidades del registro (editable en cualquier momento) */
  numeroCavidades: number
  /** Tamaños buenos: cantidad ÷ cavidades, redondeo al entero más cercano */
  tamanosBuenos: number
  /** Sobrante del registro */
  sobrante: number
  /** Orden nueva: número de planchas */
  numeroPlanchas: number
  /** Orden nueva: precio plancha × número planchas */
  valorTotal: number
  detalle: string
  /** Observación al modificar un registro cargado desde historial */
  observacion: string
  /** Diseño existente: activa reposición y recálculo de precio plancha */
  reposicionPlancha?: boolean
  /** Diseño existente con reposición: planchas a cobrar (× precio plancha) */
  cantidadReposicion?: number
  /** Registro agregado manualmente en esta orden (no importado del historial) */
  registroManual?: boolean
}

export interface PreprensaDisenoSpecs {
  designNuevo: YesNoChoice
  nombreDiseno: string
  /** Crear diseño: si está activo, se registra el valor del diseño */
  aplicaCostoDiseno: boolean
  crearDisenoCost: number
  designPdfFileName: string
  numeroCavidades: number
  colores: DisenoColoresOption | ''
  /** Tipos de plancha por cada color de la selección */
  coloresPlanchas: DisenoColorPlanchaItem[]
  /** Suma de valorTotal de todos los registros en coloresPlanchas */
  valorTotalPlanchas: number
  planchaId: string
  /** Snapshot: nombre y medida del tipo de plancha del catálogo */
  planchaNombreMedida: string
  /** Snapshot: valor (COP) del tipo de plancha del catálogo */
  planchaValor: number
  /** Diseño existente: orden donde se registró el diseño elegido */
  disenoExistenteId: string
  disenoExistenteNombre: string
  /** Diseño existente: origen de la plancha del cliente */
  planchaClienteTipo: PlanchaClienteTipo | ''
  /** Costo cuando planchaClienteTipo es plancha-nueva */
  planchaNuevaCosto: number
  lineaTroquel: boolean
  reservaUv: boolean
  estampado: boolean
  repuje: boolean
  precioMontajeId: string
  precioMontajeNombre: string
  precioMontajeCosto: number
}

export const emptyPreprensaDiseno = (): PreprensaDisenoSpecs => ({
  designNuevo: 'si',
  nombreDiseno: '',
  aplicaCostoDiseno: false,
  crearDisenoCost: 0,
  designPdfFileName: '',
  numeroCavidades: 0,
  colores: '',
  coloresPlanchas: [],
  valorTotalPlanchas: 0,
  planchaId: '',
  planchaNombreMedida: '',
  planchaValor: 0,
  disenoExistenteId: '',
  disenoExistenteNombre: '',
  planchaClienteTipo: '',
  planchaNuevaCosto: 0,
  lineaTroquel: false,
  reservaUv: false,
  estampado: false,
  repuje: false,
  precioMontajeId: '',
  precioMontajeNombre: '',
  precioMontajeCosto: 0,
})
