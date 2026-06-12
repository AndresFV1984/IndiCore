export const ACABADOS_SUB_TABS = [
  { id: 'operaciones', label: 'Operaciones' },
  { id: 'responsable', label: 'Responsable' },
] as const

export type AcabadosSubTabId = (typeof ACABADOS_SUB_TABS)[number]['id']
