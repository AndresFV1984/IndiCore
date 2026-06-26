export const PRODUCTION_COBRO_COPY = {
  panelDesc:
    'Revise el consolidado de cargos por etapa y confirme el total antes de generar la factura de cobro.',
  title: 'Factura de cobro',
  subtitle: 'Consolidado de valores configurados en la orden de producción',
  status: {
    ready: 'Lista para cobro',
  },
  header: {
    cliente: 'Cliente',
    trabajo: 'Trabajo',
    cantidad: 'Cantidad OP',
    sinCliente: 'Sin cliente',
    sinTrabajo: 'Sin nombre de trabajo',
    sinCantidad: '—',
  },
  overview: {
    title: 'Resumen por etapa',
    hint: 'Seleccione una etapa para ver el detalle de sus conceptos.',
    sinCargos: 'Sin cargos',
    conceptos: (count: number) =>
      `${count} concepto${count === 1 ? '' : 's'}`,
  },
  sections: {
    preprensa: 'Preprensa',
    cortePapel: 'Corte de papel',
    impresion: 'Impresión',
    terminados: 'Terminados',
    acabados: 'Acabados',
  },
  breakdown: {
    title: 'Detalle de conceptos',
    hint: 'Desglose de cada valor incluido en la factura de cobro.',
    columnConcepto: 'Concepto',
    columnValor: 'Valor',
    emptySection: 'Sin cargos en esta etapa',
    verTodas: 'Ver todas las etapas',
    filtrando: (title: string) => `Mostrando solo ${title}`,
  },
  summary: {
    title: 'Total a cobrar',
    hint: 'Suma de todas las etapas con valores configurados.',
    subtotalEtapa: 'Subtotal etapa',
    etapasActivas: (active: number, total: number) =>
      `${active} de ${total} etapas con cargos`,
    conceptosTotales: (count: number) =>
      `${count} concepto${count === 1 ? '' : 's'} en total`,
    generarHint:
      'Verifique cliente, trabajo y montos antes de emitir la factura de cobro.',
  },
  discount: {
    title: 'Descuento',
    hint: 'Opcional. Aplique un descuento en porcentaje o en valor fijo.',
    modoPorcentaje: 'Porcentaje',
    modoValor: 'Valor fijo',
    ariaModo: 'Tipo de descuento',
    inputPorcentajeLabel: 'Descuento (%)',
    inputValorLabel: 'Descuento ($)',
    inputPorcentajePlaceholder: 'Ej. 10',
    inputValorPlaceholder: 'Ej. 50000',
    aplicado: 'Descuento aplicado',
    totalConDescuento: 'Total a cobrar con descuento',
    sinDescuento: 'Sin descuento',
  },
  subtotal: 'Subtotal',
  grandTotal: 'Total a cobrar',
  emptyInvoice: 'Aún no hay valores de cobro en esta orden',
  emptyInvoiceHint:
    'Configure al menos una etapa (Preprensa, Corte, Impresión, Terminados o Acabados) para armar la factura.',
  emptyChecklistTitle: 'Etapas de la orden',
} as const
