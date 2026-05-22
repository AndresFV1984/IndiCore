export const PRODUCTION_WORKFLOW_TABS = [
  {
    id: 'especificaciones',
    label: 'Especificaciones',
    shortLabel: 'Specs',
    description: 'Cliente, trabajo y cantidades',
  },
  {
    id: 'prepensa',
    label: 'Preprensa',
    shortLabel: 'Pre',
    description: 'Planchas y montaje',
  },
  {
    id: 'corte-papel',
    label: 'Corte de papel',
    shortLabel: 'Corte',
    description: 'Papel, pliegos y medidas',
  },
  {
    id: 'impresion',
    label: 'Impresión',
    shortLabel: 'Imp.',
    description: 'Máquina y salida',
  },
  {
    id: 'terminados',
    label: 'Terminados',
    shortLabel: 'Term.',
    description: 'Acabados de catálogo',
  },
  {
    id: 'acabados',
    label: 'Acabados',
    shortLabel: 'Acab.',
    description: 'Operaciones finales',
  },
] as const

export type ProductionWorkflowTabId = (typeof PRODUCTION_WORKFLOW_TABS)[number]['id']

export type ProductionWorkflowTab = (typeof PRODUCTION_WORKFLOW_TABS)[number]
