export const CORTE_PAPEL_SUB_TABS = [
  { id: 'corte', label: 'Corte' },
  { id: 'tintas', label: 'Tintas' },
] as const

export type CortePapelSubTabId = (typeof CORTE_PAPEL_SUB_TABS)[number]['id']
