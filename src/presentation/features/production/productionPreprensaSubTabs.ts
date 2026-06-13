export const PREPRENSA_SUB_TABS = [
  { id: 'diseno', label: 'Diseño' },
  { id: 'responsable', label: 'Responsable' },
] as const
export type PreprensaSubTabId = (typeof PREPRENSA_SUB_TABS)[number]['id']
