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
    panelTag: 'Cálculo',
    panelTitle: 'Cantidad de hojas y valor del corte',
    panelHint:
      'Ingrese hojas entregadas y tamaños buenos con sobrante. Si hay faltante, use el registro de litografía para cobrar papel y/o corte según el estado del papel.',
    tamanosBuenosLabel: 'Tamaños buenos',
    sobranteLabel: 'Sobrante',
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
    registroMarca: 'Papel faltante del cliente',
    registroMarcaHint:
      'Corresponde a hojas que el cliente no entregó; litografía suministra el material y el corte.',
    registroPickerLabel: (parentLabel: string) => `Papel faltante del cliente · ${parentLabel}`,
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
    },
    valores: {
      title: 'Cantidad y valor',
      subtitle: 'Cálculo automático según Preprensa y el despiece elegido',
      grupoCatalogo: 'Tarifas del catálogo',
      grupoCalculo: 'Cantidad de hojas',
      grupoResultado: 'Valor del corte',
      formulaTotal: '(Cantidad hojas ÷ Unidad empaque) × Valor corte unitario',
      formulaCantidadHojas:
        'Cantidad hojas = Σ (Tamaños buenos + Sobrante) ÷ Piezas por pliego (redondeo al entero más cercano)',
      helpSummary: 'Ver detalle del cálculo',
      pasoAjuste: 'Ajuste de redondeo',
      awaitDespiece: 'Seleccione tipo de papel y despiece por pliego para ver los cálculos.',
      helpDetalle: {
        etiquetaCampo: 'Campo en pantalla',
        etiquetaOrigen: 'Dónde se define',
        etiquetaFormula: 'Cómo se calcula',
        etiquetaResultado: 'Valor mostrado',
        cantidadHojas: {
          campo: 'Cantidad hojas',
          origenPreprensa: (registro: string) =>
            `Preprensa › Especificaciones técnicas › Registro «${registro}» › Tamaños buenos + Sobrante`,
          origenEstadoPapel:
            'Corte de papel › Cantidad de hojas y valor del corte › Tamaños buenos y sobrante',
          origenPiezas: 'Tipo de papel (paso 1) › Despiece por pliego › Piezas por pliego',
          formula: '(Tamaños buenos + Sobrante) ÷ Piezas por pliego',
          formulaConNumeros: (suma: string, piezas: string, resultado: string) =>
            `(${suma}) ÷ ${piezas} = ${resultado}`,
        },
        unidadEmpaque: {
          campo: 'Unidad empaque',
          origen: 'Catálogos › Tipo de papel › Unidad de empaque (cantidad de hojas por empaque)',
          formula: 'Se toma del tipo de papel seleccionado; no se calcula en esta pantalla',
        },
        margenRedondeo: {
          campo: 'Margen de redondeo',
          origen: 'Cantidad y valor › Ajuste de redondeo (campo editable en esta sección)',
          formula:
            'Se aplica al dividir Cantidad hojas ÷ Unidad empaque antes de multiplicar por el valor corte unitario',
        },
        valorCorteUnitario: {
          campo: 'Valor corte unit.',
          origen: 'Catálogos › Tipo de papel › Despiece por pliego › Valor corte',
          formula: 'Tarifa unitaria del despiece elegido en el paso 1',
        },
        valorCorteTotal: {
          campo: 'Valor del corte',
          origen: 'Resultado final de esta sección (barra superior)',
          formula: 'Cociente (con margen) × Valor corte unitario',
          formulaConNumeros: (cociente: string, unitario: string, resultado: string) =>
            `${cociente} × ${unitario} = ${resultado}`,
          formulaMinimo:
            'Si el producto es menor al valor corte del catálogo, se cobra el mínimo del catálogo',
          noAplicaCortado:
            'No aplica en este registro: papel cortado por el cliente (salvo hojas faltantes en registro litografía)',
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
    registroTamanosBuenos: 'Tamaños buenos',
    registroSobrante: 'Sobrante',
    registroValorHoja: 'Valor hoja',
    registroCantidadHojas: 'Cantidad hojas',
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
