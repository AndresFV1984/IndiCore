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
      subtitle:
        'Cantidad hojas = Σ (Tamaños buenos + Sobrante) ÷ Piezas por pliego (redondeo al entero más cercano)',
    },
    unidadEmpaque: {
      empty: 'Seleccione un tipo de papel',
      hintCantidad: 'Hojas por unidad de empaque (valor numérico del catálogo)',
    },
    valorCorteUnitario: {
      empty: 'Seleccione un tipo de papel con valor corte en catálogo',
    },
    margenRedondeo: {
      label: 'Margen de redondeo',
      hint:
        'En Cantidad hojas ÷ Unidad empaque: si la primera cifra decimal supera el margen, el cociente sube al entero (1,3→2); si es igual o menor, se conserva (1,1→1,1). Por defecto: 2',
    },
    cantidadHojas: {
      label: 'Cantidad Hojas',
      hint:
        'Σ (Tamaños buenos + Sobrante) en Preprensa ÷ Piezas por pliego del despiece; redondeo al entero más cercano',
      empty: 'Complete Preprensa y seleccione un despiece con piezas por pliego',
      emptySinPreprensa: 'Sin registros en Preprensa',
      emptySinDespiece: 'Seleccione tipo de papel y despiece por pliego',
    },
    valorCorte: {
      label: 'Valor Corte (total)',
      hint:
        '(Cantidad hojas ÷ Unidad empaque, con margen de redondeo) × Valor corte seleccionado; si el total es menor al valor del catálogo, se usa el valor del catálogo',
      hintCociente: 'Cociente aplicado: {cociente}',
      empty: 'Complete los campos anteriores para calcular el total',
      emptySinTipo: 'Seleccione un tipo de papel',
      emptySinValorUnitario: 'El tipo de papel no tiene valor corte en catálogo',
      emptySinUnidad: 'La unidad de empaque debe incluir una cantidad (ej. Resma 250 hojas)',
      emptySinHojas: 'Calcule primero la cantidad de hojas en Preprensa',
    },
  },
  resumen: {
    title: 'Resumen del corte',
    subtitle: 'Papel, despiece y valores registrados en esta orden',
    valorPapelLabel: 'Valor papel',
    valorPapelHint: 'Cantidad hojas × Valor hoja del tipo de papel',
    totalLabel: 'Valor corte',
    totalHint: 'Monto del servicio de corte',
    empty: '—',
  },
} as const
