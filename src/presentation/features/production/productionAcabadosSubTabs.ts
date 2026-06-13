export const ACABADOS_SUB_TABS = [
  { id: 'acabado', label: 'Acabado' },
  { id: 'responsable', label: 'Responsable' },
] as const

export type AcabadosSubTabId = (typeof ACABADOS_SUB_TABS)[number]['id']
