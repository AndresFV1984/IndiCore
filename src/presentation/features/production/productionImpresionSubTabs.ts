export const IMPRESION_SUB_TABS = [
  { id: 'tintas', label: 'Tintas' },
  { id: 'maquina', label: 'Máquina' },
] as const

export type ImpresionSubTabId = (typeof IMPRESION_SUB_TABS)[number]['id']
