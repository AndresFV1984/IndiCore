export const IMPRESION_SUB_TABS = [
  { id: 'tintas', label: 'Tintas' },
  { id: 'muestra', label: 'Estimar Tintas' },
  { id: 'conversionImagen', label: 'Conversión img' },
  { id: 'responsable', label: 'Responsable' },
] as const

export type ImpresionSubTabId = (typeof IMPRESION_SUB_TABS)[number]['id']
