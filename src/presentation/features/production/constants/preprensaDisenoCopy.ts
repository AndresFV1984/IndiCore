/** Textos de la sección Preprensa › Diseño */
export const PREPRENSA_DISENO_COPY = {
  acabados: {
    lineaTroquel: 'L\u00EDnea troquel',
    reservaUv: 'Reserva UV',
    estampado: 'Estampado',
    repuje: 'Repuje',
  },
  sectionTags: {
    trabajo: 'Historial',
    identidad: 'Nombre',
    costo: 'Costo',
    archivo: 'PDF',
    especificaciones: 'T\u00E9cnico',
    acabados: 'Acabados',
    montaje: 'Montaje',
  },
  existente: {
    ariaLabel: 'Configuraci\u00F3n del dise\u00F1o existente',
    modeLabel: 'Dise\u00F1o existente',
    trabajoTitle: 'Trabajo ya realizado',
    trabajoSubtitle:
      'Seleccione una orden anterior de este cliente para reutilizar su informaci\u00F3n',
    specsSubtitle:
      'Colores, planchas y registros t\u00E9cnicos (igual que en dise\u00F1o nuevo). Opcionalmente importe un trabajo anterior arriba.',
  },
  nuevo: {
    ariaHistorial: 'Informaci\u00F3n del trabajo ya realizado',
    ariaNuevo: 'Configuraci\u00F3n del dise\u00F1o nuevo',
    tituloHistorial: 'Datos del trabajo anterior',
    tituloNuevo: 'Datos del dise\u00F1o nuevo',
    leadHistorial:
      'Revise la informaci\u00F3n importada y ajuste solo lo que cambie en esta orden.',
    leadNuevo:
      'Complete las secciones en orden. Cada bloque agrupa un aspecto del arte y la producci\u00F3n.',
    bannerTitulo: 'Informaci\u00F3n del trabajo ya realizado',
    refDiseno: 'Dise\u00F1o',
    sinNombreDiseno: 'Sin nombre de dise\u00F1o',
    bannerDesc:
      'Los campos siguientes se completaron con los datos registrados en esa orden anterior. Revise y ajuste solo lo que cambie en esta producci\u00F3n.',
    nombreTituloHistorial: 'Nombre del dise\u00F1o',
    nombreTitulo: 'Nombre',
    nombreLabel: 'Nombre del dise\u00F1o',
    nombreSubHistorial: 'Registrado en el trabajo anterior',
    nombreSub: 'Nombre del trabajo gr\u00E1fico',
    nombrePlaceholder: 'Ej. Empaque caja premium 2026',
    servicioTitulo: 'Servicio de dise\u00F1o',
    servicioSubHistorial: 'Costo registrado en el trabajo anterior',
    servicioSub: 'Valor del servicio de dise\u00F1o',
    pdfSub: (maxMb: number) => `M\u00E1ximo ${maxMb} MB`,
    pdfPlaceholder: 'Haga clic para seleccionar archivo',
    pdfExaminar: 'Examinar',
    pdfQuitar: 'Quitar',
    pdfPreview: (fileName: string) => `Vista previa: ${fileName}`,
    specsTitulo: 'Especificaciones t\u00E9cnicas',
    specsSubHistorial: 'Datos t\u00E9cnicos del trabajo anterior',
    acabadosTitulo: 'Acabados de dise\u00F1o',
    acabadosSub: 'Seleccione los que apliquen',
    acabadosAria: 'Acabados',
    montajeTitulo: 'Precio de montaje',
    montajeSub: 'Seleccione la tarifa que aplica a esta orden',
  },
  coloresPlanchas: {
    tamanosBuenosFormula: 'Cantidad ÷ Cavidades (redondeo al entero más cercano)',
    tamanosBuenosNeedCavidades: 'Indique las cavidades para calcular los tamaños buenos.',
    tamanosBuenosNeedCantidad: 'Indique la cantidad para calcular los tamaños buenos.',
    faltaCavidad: 'Falta cavidades',
    faltaCantidad: 'Falta cantidad',
    validationTitle: 'Revise el registro',
    legacyIntro:
      'Elija la cantidad de colores. Cada tarjeta muestra las tintas incluidas (CMYK, secundarios y Pantone).',
    colorPickerPlaceholder: 'Seleccione cuántos colores lleva la plancha',
    colorPickerHint: 'Pulse una tarjeta de 1-Color a 7-Colores o más',
    colorPickerEditHint:
      'Cambie la cantidad de colores eligiendo otra tarjeta en el formulario de edición.',
    sinPlanchasActivas: 'Sin tipos de plancha activos en el catálogo.',
    pasos: {
      tipoPlancha: 'Seleccione el tipo de plancha del catálogo vigente.',
      descripcion: 'Describa el registro (tinta, acabado, observación técnica, etc.).',
      detalle: 'Detalle técnico del registro (obligatorio).',
    },
    registro: {
      editing: 'Editando registro',
      edit: 'Editar registro',
      editIntro:
        'Cambie la cantidad de colores en el desplegable y actualice los demás datos. Pulse «Guardar cambios» al terminar.',
      saveEdit: 'Guardar cambios',
    },
    validation: {
      selectColor: 'Seleccione un color de la lista.',
      selectPlancha: 'Seleccione el tipo de plancha.',
      detalleOpCantidad:
        'Registre la cantidad en Especificaciones › Detalle OP antes de agregar planchas.',
      numeroPlanchasSiete: 'Ingrese el número de planchas (7 o más).',
      numeroPlanchasColores: 'Seleccione la cantidad de colores de la lista.',
      numeroPlanchasMinimo: 'El número de planchas debe ser 7 o mayor.',
      cantidadRegistro: 'Ingrese la cantidad del registro.',
      descripcionRegistro: 'Ingrese la descripción del registro.',
      cavidadesRegistro: 'Ingrese el número de cavidades (mayor a cero).',
      detalleRegistro: 'Ingrese el detalle del registro.',
      registroDuplicado:
        'Ya existe un registro con el mismo tipo de plancha y la misma descripción o detalle.',
      historialSinPlancha: 'Seleccione el tipo de plancha del catálogo actual.',
      historialPlanchaInactiva: 'El tipo de plancha seleccionado ya no está activo en el catálogo.',
      historialSinObservacion: 'Ingrese una observación al actualizar este registro.',
    },
  },
  planchaSuministro: {
    ariaLabel: 'Quién suministra las planchas',
    tag: 'Suministro',
    title: 'Suministro de planchas',
    subtitle: 'Indique si las planchas las provee la empresa o el cliente',
    avisoCliente:
      'El cliente entrega las planchas: en este registro no se cobra precio de plancha.',
    precioNoAplica: 'No aplica (cliente suministra)',
    opciones: {
      empresa: {
        title: 'Litografía suministra planchas',
        description: 'La empresa provee las planchas según catálogo y Preprensa',
      },
      cliente: {
        title: 'Cliente suministra planchas',
        description: 'El cliente entrega las planchas; no se cobra precio de plancha',
      },
    },
  },
  pdf: {
    soloPdf: 'Solo se permiten archivos PDF.',
    maxSize: (maxMb: number) => `El archivo no debe superar ${maxMb} MB.`,
    previewLoading: 'Generando vista previa…',
    previewError:
      'No se pudo mostrar la vista previa en este dispositivo. Puede abrir el archivo con el enlace.',
    previewOpen: (fileName: string) => `Abrir ${fileName}`,
    previewPagesHint: (total: number) =>
      `Vista previa: página 1 de ${total}. Use «Abrir» para ver el documento completo.`,
  },
} as const
