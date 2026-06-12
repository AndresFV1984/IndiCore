export const TERMINADOS_SUB_TABS = [
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'responsable', label: 'Responsable' },
] as const

export type TerminadosSubTabId = (typeof TERMINADOS_SUB_TABS)[number]['id']
