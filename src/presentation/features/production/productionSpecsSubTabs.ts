export const SPECS_SUB_TABS = [
  { id: 'cliente', label: 'Cliente' },
  { id: 'detalle-op', label: 'Detalle OP' },
] as const

export type SpecsSubTabId = (typeof SPECS_SUB_TABS)[number]['id']
