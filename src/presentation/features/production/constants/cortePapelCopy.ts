export const CORTE_PAPEL_COPY = {
  panelDesc:
    'Registre el tipo de papel, el despiece asociado y los valores de producción para esta orden.',
  detailAria: 'Configuración del corte de papel',
  titulo: 'Datos del corte de papel',
  lead:
    'Complete las secciones en orden. Cada bloque agrupa el material, el despiece y la producción.',
  sectionTags: {
    papel: 'Papel',
    valores: 'Producción',
    resumen: 'Resumen',
  },
  sections: {
    papel: {
      title: 'Tipo de papel',
      subtitle: 'Seleccione el material y el despiece por pliego asociado',
    },
    valores: {
      title: 'Cantidad y valor',
      subtitle: 'Registre hojas y valor del servicio de corte',
    },
  },
  resumen: {
    title: 'Resumen del corte',
    subtitle: 'Papel, despiece y valores registrados en esta orden',
    totalLabel: 'Valor corte',
    totalHint: 'Monto del servicio de corte',
    empty: '—',
  },
} as const
