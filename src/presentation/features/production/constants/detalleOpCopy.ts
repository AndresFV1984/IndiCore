export const DETALLE_OP_COPY = {
  intro:
    'Defina el nombre del trabajo, la cantidad a producir y el vendedor responsable de la orden.',
  progress: {
    trabajo: 'Trabajo',
    cantidad: 'Cantidad',
    vendedor: 'Vendedor',
  },
  trabajo: {
    tag: 'Trabajo',
    title: 'Identificación del pedido',
    subtitle: 'Nombre y volumen de la orden de producción.',
    workLabel: 'Nombre del trabajo',
    workPlaceholder: 'Ej. Catálogo corporativo 2026',
    workHint: 'Use un nombre claro que identifique el producto o campaña.',
    qtyLabel: 'Cantidad',
    qtyPlaceholder: 'Ej. 5000',
    qtyHint: 'Unidades a producir. Habilita cálculos en Preprensa y planchas.',
    qtyUnit: 'unidades',
  },
  vendedor: {
    tag: 'Comercial',
    title: 'Vendedor asignado',
    subtitle: 'Persona de ventas responsable del seguimiento comercial.',
  },
} as const
