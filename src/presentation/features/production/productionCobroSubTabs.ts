export const COBRO_SUB_TABS = [
  { id: 'factura', label: 'Costeo' },
  { id: 'responsable', label: 'Responsable' },
] as const

export type CobroSubTabId = (typeof COBRO_SUB_TABS)[number]['id']
