export const CORTE_PAPEL_COPY = {
  panelDesc:
    'Registre el tipo de papel, el despiece asociado y los valores de producción para esta orden.',
  detailAria: 'Configuración del corte de papel',
  titulo: 'Datos del corte de papel',
  lead: 'Seleccione el registro de Preprensa, complete el tipo de papel y pulse «Agregar registro».',
  registroAcciones: {
    agregar: 'Agregar registro',
    guardar: 'Guardar cambios',
    cancelar: 'Cancelar',
  },
  sectionTags: {
    papel: 'Papel',
    valores: 'Producción',
    resumen: 'Resumen',
  },
  suministro: {
    ariaLabel: 'Quién suministra el papel',
    tag: 'Suministro',
    title: 'Suministro de papel',
    subtitle: 'Indique si el papel lo provee la empresa o el cliente',
    lead: 'El flujo de corte y los valores dependen de quién entrega el material.',
    avisoCliente:
      'El cliente entrega el papel: en este registro no se cobra valor de papel. El corte y el papel del faltante se facturan aparte si hay hojas faltantes.',
    opciones: {
      empresa: {
        title: 'Litografía suministra papel',
        description: 'La empresa provee y corta el papel según Preprensa y catálogo',
      },
      cliente: {
        title: 'Cliente suministra papel',
        description: 'El cliente entrega el material; se registran cortes y cantidades por registro',
      },
    },
    switchConfirmTitle: 'Cambiar suministro de papel',
    switchConfirmMessage: (targetLabel: string) =>
      `Al cambiar a \u00AB${targetLabel}\u00BB se borrar\u00E1 la informaci\u00F3n de corte de papel registrada en esta orden. \u00BFDesea continuar?`,
    switchConfirmLabel: 'Continuar y limpiar',
  },
  registroPreprensa: {
    ariaLabel: 'Selección de registro de Preprensa',
    tag: 'Preprensa',
    title: 'Registro de Preprensa',
    subtitle: 'Cada registro de colores y planchas tiene su propio corte de papel.',
    label: 'Seleccione tipo de plancha',
    placeholder: 'Seleccione tipo de plancha…',
    hint: 'Elija el registro que desea configurar. Los completados aparecen marcados en el listado.',
    estadoCompletado: 'Completado',
    /** Separación visual entre el nombre del registro y «Completado» en el select. */
    completadoSeparador: '  —  ',
    banner: 'Configurando corte para:',
    emptySinRegistros:
      'Agregue al menos un registro en Preprensa › Diseño (colores y planchas) para configurar el corte de papel.',
  },
  estadoCorte: {
    ariaLabel: 'Estado del papel al recibirlo',
    tag: 'Estado',
    title: 'Estado del papel',
    subtitle: 'Indique si el material llega ya cortado o debe cortarse en planta',
    opcionesAria: 'Estado del papel: cortado o sin cortar',
    hojasEntregadasLabel: 'Hojas entregadas por el cliente',
    panelTag: 'Entrada',
    panelTitle: 'Cantidades del material',
    panelHint:
      'Registre lo entregado por el cliente. Los totales de hojas y corte se calculan automáticamente más abajo.',
    tamanosBuenosLabel: 'Tamaños buenos',
    sobranteLabel: 'Sobrante',
    cantidadPlaceholder: 'Ingrese cantidad',
    cortado: {
      title: 'Papel cortado',
      description:
        'El cliente entrega el material ya cortado; no se cobra corte ni valor de papel, salvo que haya hojas faltantes (litografía suministra el resto con valor papel y corte).',
    },
    sinCortar: {
      title: 'Sin cortar',
      description:
        'El material requiere corte en planta; no se cobra valor de papel en este registro. Si hay hojas faltantes, litografía cobra papel y corte en un registro aparte.',
    },
    switchConfirmTitle: 'Cambiar estado del papel',
    switchConfirmMessage: (targetLabel: string) =>
      `Al cambiar a \u00AB${targetLabel}\u00BB se borrar\u00E1 la informaci\u00F3n de corte registrada en este registro. \u00BFDesea continuar?`,
    switchConfirmLabel: 'Continuar y limpiar',
  },
  faltante: {
    tag: 'Comparación',
    title: 'Hojas faltantes',
    hint: 'Compare la cantidad de hojas del corte con lo que entregó el cliente.',
    formulaAria: 'Cálculo de hojas faltantes',
    calculadasLabel: 'Calculadas',
    calculadasNota: 'Igual a Cantidad hojas en Cantidad y valor',
    entregadasLabel: 'Entregadas',
    entregadasNota: 'Lo que ingresó el cliente',
    faltanteLabel: 'Faltantes',
    faltanteNota: 'Litografía puede suministrar este resto',
    pendienteEntregadas: 'Ingrese hojas entregadas arriba',
    pendienteDespiece: 'Seleccione despiece en paso 1',
    completarParaComparar: 'Complete despiece y hojas entregadas',
    sinFaltante: 'No hay faltante: el cliente entregó suficientes hojas.',
    agregarLead: (hojas: string) =>
      `Faltan ${hojas} hojas. Cree un registro con valor papel y corte de litografía.`,
    agregarRegistro: 'Agregar registro · Litografía suministra',
    editarRegistro: 'Ir al registro de faltante',
    yaExiste: 'Ya existe un registro de faltante para este ítem.',
    bannerTitle: 'Litografía suministra el faltante',
    bannerDesc: (hojas: string) =>
      `Este registro cubre ${hojas} hojas no entregadas por el cliente. Se cobran valor papel y valor corte como suministro de litografía.`,
    /** Marca visible en selector, resumen y formulario del registro creado por faltante. */
    registroMarca: 'Litografía suministra faltante',
    registroMarcaHint:
      'Hojas que el cliente no entregó; litografía suministra el papel y el corte sobre esa cantidad.',
    registroPadreLabel: (parentLabel: string) => `Faltante de ${parentLabel}`,
    registroPickerLabel: (parentLabel: string) => `Litografía suministra · ${parentLabel}`,
    registroPickerGrupo: 'Litografía suministra faltante',
    cantidadHojasFaltanteNota: 'Cantidad hojas = hojas faltantes del registro del cliente',
    requiereDespiece: 'Seleccione tipo de papel y despiece en «Datos del corte de papel».',
    registroCantidadTag: 'Faltante',
    registroCantidadTitle: 'Cantidad de hojas y valor del corte',
    registroCantidadSubtitle:
      'Indique tamaños buenos y sobrante del material que suministrará litografía por el faltante.',
    registroCantidadHint:
      'La cantidad de hojas se calcula igual que en litografía: (Tamaños buenos + Sobrante) ÷ Piezas por pliego.',
  },
  sections: {
    papel: {
      title: 'Tipo de papel',
      subtitle: 'Seleccione el material y el despiece por pliego asociado',
      grupoSeleccion: 'Selección',
      grupoCatalogo: 'Datos del catálogo',
      grupoDespiece: 'Despiece por pliego',
      sinDespieces: 'Este tipo de papel no tiene despieces por pliego en catálogo.',
      agregarDespiecesHint: (nombre: string) =>
        `Agregue despieces en Catálogos › Tipo de papel para «${nombre}».`,
      agregarDespieces: 'Agregar despieces en catálogo',
      gestionarDespieces: 'Gestionar despieces en catálogo',
      pliegoDiagram: {
        title: 'Distribución en el pliego',
        emptyDespiece: 'Seleccione un despiece para ver cómo quedan las piezas en el papel.',
        unavailable: 'No se pudo calcular la distribución con las medidas actuales.',
        rotatedHint: 'Pieza rotada 90°',
        paperSwappedHint: 'Pliego rotado 90°',
        algorithmLabel: (algorithm: string) => {
          if (algorithm === 'strip') return 'Strip packing (bandas horizontales)'
          if (algorithm === 'skyline') return '2D bin packing (skyline)'
          return 'Cuadrícula guillotina'
        },
        gridLabel: (cols: number, rows: number, total: number, shelfCounts: number[]) => {
          if (shelfCounts.length > 0) {
            return `${shelfCounts.length} bandas: ${shelfCounts.join(' + ')} = ${total.toLocaleString('es-CO')} piezas`
          }
          return `${cols} columnas × ${rows} filas = ${total.toLocaleString('es-CO')} piezas por pliego`
        },
        wasteLabel: (wasteArea: number, wastePercent: number, unit: string) => {
          const areaUnit = unit.toLowerCase() === 'cm' ? 'cm²' : `${unit}²`
          const waste = Math.round(wasteArea * 10) / 10
          const percent = Math.round(wastePercent * 10) / 10
          if (waste <= 0) return 'Desperdicio mínimo: aprovechamiento total del pliego'
          return `Desperdicio: ${waste.toLocaleString('es-CO')} ${areaUnit} (${percent.toLocaleString('es-CO')}%)`
        },
        dimAnchoLabel: (value: string, unit: string) => `Ancho ${value} ${unit}`,
        dimLargoLabel: (value: string, unit: string) => `Largo ${value} ${unit}`,
        pieceDimLabel: (ancho: string, largo: string) => `${ancho}×${largo}`,
      },
    },
    valores: {
      title: 'Cantidad y valor',
      subtitle: 'Cálculo automático según Preprensa y el despiece elegido',
      cliente: {
        title: 'Resultado',
        subtitle: 'Totales calculados con las cantidades ingresadas y el despiece seleccionado',
        metaSeparator: '·',
      },
      grupoCatalogo: 'Tarifas del catálogo',
      grupoCalculo: 'Cantidad de hojas',
      grupoResultado: 'Valor del corte',
      formulaTotal: '(Cantidad hojas ÷ Unidad empaque) × Valor corte unitario',
      formulaCantidadHojas:
        'Cantidad hojas = Σ (Tamaños buenos + Sobrante) ÷ Piezas por pliego (redondeo al entero más cercano)',
      helpSummary: 'Ver fórmula de cálculo',
      formulaSummary: 'Ver fórmula de cálculo',
      pasoAjuste: 'Ajuste de redondeo',
      awaitDespiece: 'Seleccione tipo de papel y despiece por pliego para ver los cálculos.',
      helpDetalle: {
        cantidadHojas: {
          titulo: 'Cantidad hojas',
          formulaBase:
            'Se suman Tamaños buenos + Sobrante y se divide entre Piezas por pliego del despiece. El resultado se redondea al entero más cercano.',
          formulaConNumeros: (suma: string, piezas: string, resultado: string) =>
            `${suma} ÷ ${piezas} piezas/pliego = ${resultado} hojas`,
        },
        valorCorteTotal: {
          titulo: 'Valor del corte',
          formulaBase:
            'Primero se divide Cantidad hojas entre Unidad empaque (aplicando el margen de redondeo al cociente). Luego se multiplica ese cociente por el Valor corte unitario del catálogo.',
          formulaConNumeros: (
            cantidadHojas: string,
            unidadEmpaque: string,
            cociente: string,
            margen: string,
            unitario: string,
            resultado: string
          ) =>
            [
              `${cantidadHojas} hojas ÷ ${unidadEmpaque} unidad empaque = ${cociente} (margen ${margen})`,
              `${cociente} × ${unitario} = ${resultado}`,
            ].join('\n'),
          formulaMinimo:
            'Si el total calculado es menor al valor corte del catálogo, se cobra el mínimo del catálogo.',
          noAplicaCortado:
            'No aplica en este registro: el papel llega cortado por el cliente.',
        },
      },
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
      hintShort: 'Σ (Tamaños buenos + Sobrante) ÷ Piezas por pliego del despiece',
      hintSinCortar:
        'Σ (Tamaños buenos + Sobrante ingresados) ÷ Piezas por pliego; redondeo al entero más cercano',
      empty: 'Complete Preprensa y seleccione un despiece con piezas por pliego',
      emptySinPreprensa: 'Sin registros en Preprensa',
      emptySinDespiece: 'Seleccione tipo de papel y despiece por pliego',
      emptySinTamanosBuenos: 'Ingrese tamaños buenos (y sobrante si aplica) en Estado del papel',
    },
    valorCorte: {
      label: 'Valor Corte (total)',
      hint:
        '(Cantidad hojas ÷ Unidad empaque, con margen de redondeo) × Valor corte seleccionado; si el total es menor al valor del catálogo, se usa el valor del catálogo',
      hintCociente: 'Cociente aplicado: {cociente}',
      noAplicaCortado: 'No aplica',
      emptyNoAplicaCortado: 'No aplica (papel cortado; faltante en registro litografía)',
      hintNoAplicaCortado:
        'No se cobra corte en este registro si el papel viene cortado; las hojas faltantes se cobran en el registro de litografía.',
      empty: 'Complete los campos anteriores para calcular el total',
      emptySinTipo: 'Seleccione un tipo de papel',
      emptySinDespiece: 'Seleccione un despiece por pliego',
      emptySinTamanosBuenos: 'Ingrese tamaños buenos en Estado del papel',
      emptySinValorUnitario: 'El tipo de papel no tiene valor corte en catálogo',
      emptySinUnidad: 'La unidad de empaque debe incluir una cantidad (ej. Resma 250 hojas)',
      emptySinHojas: 'Calcule primero la cantidad de hojas',
    },
  },
  resumen: {
    title: 'Resumen del corte',
    subtitle: 'Registros configurados en esta orden',
    subtitleCompacto: (completados: number, total: number) =>
      `${completados} de ${total} listo${total === 1 ? '' : 's'} · Clic en un registro para editarlo`,
    subtitleConsolidado: 'Totales y detalle por registro de Preprensa',
    valorPapelLabel: 'Valor papel',
    valorPapelHint: 'Cantidad hojas × Valor hoja del tipo de papel',
    valorPapelClienteSuministra:
      'No aplica en este registro (cliente suministra). Si hay faltante, el valor papel va en el registro de litografía.',
    totalLabel: 'Valor corte',
    totalHint: 'Monto del servicio de corte',
    totalHintConsolidado: 'Suma del valor corte de todos los registros',
    totalCantidadHojas: 'Total cantidad hojas',
    totalValorPapel: 'Total valor papel',
    registroTipoPapel: 'Tipo de papel',
    registroPiezasPorPliego: 'Piezas por pliego',
    registroValorCorteUnitario: 'Valor corte unitario',
    registroEstadoPapel: 'Estado del papel',
    registroEstadoCortado: 'Cortado',
    registroEstadoSinCortar: 'Sin cortar',
    registroPadre: 'Registro padre',
    registroTamanosBuenos: 'Tamaños buenos',
    registroSobrante: 'Sobrante',
    registroValorHoja: 'Valor hoja',
    registroCantidadHojas: 'Cantidad hojas',
    registroHojasFaltanteRestadas: 'Hojas faltantes restadas',
    registroEditar: 'Editar registro',
    registroCompletado: 'Completado',
    registroPendiente: 'Pendiente',
    registroEditarHint: 'Clic para volver a este registro y modificar sus datos',
    registroEditando: 'Editando este registro arriba',
    registroEditandoBadge: 'Editando ahora',
    registroEditandoCorto: 'Editando',
    registroEliminar: 'Eliminar',
    registroEliminarAria: (label: string) => `Eliminar registro: ${label}`,
    registroEliminarConfirm: (label: string) =>
      `¿Eliminar el corte de papel de «${label}»? Se limpiará el tipo de papel y los valores de este registro.`,
    registroValorCorte: 'Valor total corte',
    registroValorTotalPapel: 'Valor total papel',
    registroFaltanteLitografia: 'Faltante — Litografía suministra papel',
    empty: '—',
  },
} as const
