export type YesNoChoice = 'si' | 'no'

export type PlanchaClienteTipo = 'cliente-suministra' | 'plancha-existente' | 'plancha-nueva'

export type DisenoColoresOption =
  | '1-color'
  | '2-colores'
  | '3-colores'
  | '4-colores'
  | '5-colores'
  | '6-colores'
  | '7-colores-o-mas'

/** Registro: color + tipo de plancha + cavidades (par color/plancha único en la lista). */
export interface DisenoColorPlanchaItem {
  id: string
  colores: DisenoColoresOption
  planchaId: string
  planchaNombreMedida: string
  planchaValor: number
  numeroCavidades: number
  detalle: string
  /** Observación al modificar un registro cargado desde historial */
  observacion: string
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
