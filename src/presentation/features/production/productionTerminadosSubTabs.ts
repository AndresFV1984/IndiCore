export const TERMINADOS_SUB_TABS = [
  { id: 'asignacion', label: 'Terminado' },
  { id: 'responsable', label: 'Responsable' },
] as const

export type TerminadosSubTabId = (typeof TERMINADOS_SUB_TABS)[number]['id']

export const getTerminadosSubTabs = (_isNewOrder: boolean) => TERMINADOS_SUB_TABS
